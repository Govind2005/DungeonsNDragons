package com.dungeonsNdragon.refree.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.dungeonsNdragon.refree.dto.ActionRequest;
import com.dungeonsNdragon.refree.dto.TurnResult;
import com.dungeonsNdragon.refree.engine.GameEngine;
import com.dungeonsNdragon.refree.entities.MatchState;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefereeService {
    private final GameEngine engine;
    private final MatchStateCache cache;
    private final RestTemplate restTemplate;

    @Value("${services.vault.url}")
    private String vaultUrl;

    @Value("${services.bouncer.url}")
    private String bouncerUrl;

    @Value("${services.scribe.url}")
    private String scribeUrl;

    public TurnResult processAction(ActionRequest action) {
        UUID matchId  = action.getMatchId();
        String lockValue = null;
        try {
            lockValue = cache.tryAcquireLock(matchId);
            if (lockValue == null) {
                return TurnResult.builder().matchId(matchId).valid(false)
                        .rejectionReason("Another action is being processed. Please wait.").build();
            }

            MatchState currentState = cache.getState(matchId);
            TurnResult result = engine.compute(currentState, action);

            if (!result.isValid()) {
                log.info("Invalid action by {} in match {}: {}",
                        action.getActorPlayerId(), matchId, result.getRejectionReason());
                return result;
            }

            MatchState newState = applyResultToState(currentState, result);
            cache.writeState(newState);
            persistTurnToVault(result);

            if (result.getWinnerTeam() != null) {
                notifyScribe(matchId, result.getWinnerTeam(), newState);
                cache.evict(matchId);
            }

            return result;
        } finally {
            if (lockValue != null) cache.releaseLock(matchId, lockValue);
        }
    }

    private MatchState applyResultToState(MatchState old, TurnResult result) {
        TurnResult.MatchStateSnapshot snap = result.getStateAfter();

        List<MatchState.PlayerState> players = snap.getPlayers().stream()
                .map(ps -> {
                    MatchState.PlayerState oldPlayer = old.getPlayerByPlayerId(ps.getPlayerId());
                    List<MatchState.ActiveEffect> detailedEffects = new ArrayList<>();
                    if (ps.getActiveEffects() != null) {
                        for (String type : ps.getActiveEffects()) {
                            // 1. Try to find in existing effects (minus 1 turn if it was ticked)
                            MatchState.ActiveEffect existing = oldPlayer != null && oldPlayer.getEffects() != null
                                    ? oldPlayer.getEffects().stream().filter(e -> e.getEffectType().equals(type)).findFirst().orElse(null)
                                    : null;
                            
                            if (existing != null) {
                                // Important: We trust the GameEngine's tick. 
                                // If it's still in the snapshot, it hasn't expired.
                                // We decrement turns if it was the actor's turn (since computer does that)
                                int turns = existing.getTurnsRemaining();
                                if (ps.getPlayerId().equals(result.getActorPlayerId())) {
                                    turns = Math.max(1, turns - 1); // Minimum 1 if it's still in snapshot
                                }
                                detailedEffects.add(MatchState.ActiveEffect.builder()
                                        .effectType(type).magnitude(existing.getMagnitude()).turnsRemaining(turns).build());
                            } else {
                                // 2. Try to find in newly applied effects
                                TurnResult.EffectApplied applied = result.getEffectsApplied() != null
                                        ? result.getEffectsApplied().stream().filter(ea -> ea.getTargetPlayerId().equals(ps.getPlayerId()) && ea.getEffectType().equals(type)).findFirst().orElse(null)
                                        : null;
                                
                                if (applied != null) {
                                    detailedEffects.add(MatchState.ActiveEffect.builder()
                                            .effectType(type).magnitude(applied.getMagnitude()).turnsRemaining(applied.getTurns()).build());
                                } else {
                                    // Fallback
                                    detailedEffects.add(MatchState.ActiveEffect.builder()
                                            .effectType(type).magnitude(1).turnsRemaining(1).build());
                                }
                            }
                        }
                    }

                    return MatchState.PlayerState.builder()
                            .matchPlayerId(oldPlayer != null ? oldPlayer.getMatchPlayerId() : null)
                            .playerId(ps.getPlayerId())
                            .username(ps.getUsername())
                            .team(ps.getTeam())
                            .turnOrder(ps.getTurnOrder())
                            .characterClass(ps.getCharacterClass() != null ? ps.getCharacterClass() : "BARBARIAN")
                            .hp(ps.getHp())
                            .maxHp(ps.getMaxHp())
                            .mana(ps.getMana())
                            .maxMana(ps.getMaxMana())
                            .alive(ps.isAlive())
                            .effects(new ArrayList<>(detailedEffects))
                            .kills(ps.getKills())
                            .damageDealt(ps.getDamageDealt())
                            .healingDone(ps.getHealingDone())
                            .build();
                }).toList();

        return MatchState.builder()
                .matchId(old.getMatchId())
                .status(snap.getStatus() != null ? snap.getStatus() : "IN_PROGRESS")
                .turnNumber(snap.getTurnNumber())
                .currentTurnOrder(snap.getNextTurnOrder())
                .winnerTeam(snap.getWinnerTeam())
                .players(new ArrayList<>(players))
                .build();
    }

    private void persistTurnToVault(TurnResult result) {
        try {
            // Build a manual list of effects to match the Vault's expected "type" field
            List<Map<String, Object>> vaultEffects = new ArrayList<>();
            if (result.getEffectsApplied() != null) {
                for (TurnResult.EffectApplied eff : result.getEffectsApplied()) {
                    Map<String, Object> vEff = new HashMap<>();
                    // THE FIX: The Vault DTO expects "type", but the Referee uses "effectType"
                    vEff.put("type", eff.getEffectType());
                    vEff.put("targetPlayerId", eff.getTargetPlayerId());
                    vEff.put("magnitude", eff.getMagnitude());
                    vEff.put("turns", eff.getTurns());
                    vaultEffects.add(vEff);
                }
            }

            // Scrub the snapshot for safety before sending
            TurnResult.MatchStateSnapshot safeSnap = result.getStateAfter();
            if (safeSnap.getStatus() == null) safeSnap.setStatus("IN_PROGRESS");
            if (safeSnap.getPlayers() != null) {
                safeSnap.getPlayers().forEach(p -> {
                    if (p.getCharacterClass() == null) p.setCharacterClass("BARBARIAN");
                });
            }

            Map<String, Object> req = new HashMap<>();
            req.put("matchId", result.getMatchId());
            req.put("actorPlayerId", result.getActorPlayerId());
            req.put("actionType", result.getActionType().name());
            req.put("targetPlayerId", result.getTargetPlayerId());
            req.put("damageDealt", result.getDamageDealt());
            req.put("manaUsed", result.getManaUsed());

            // Use the newly mapped list with the correct "type" keys
            req.put("effectsApplied", vaultEffects);

            req.put("stateSnapshot", safeSnap);
            req.put("turnNumber", result.getTurnNumber());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            restTemplate.postForObject(vaultUrl + "/api/vault/matches/turn",
                    new HttpEntity<>(req, headers), Object.class);

        } catch (Exception e) {
            log.error("Failed to persist turn to Vault for match {}: {}", result.getMatchId(), e.getMessage());
        }
    }

    private void notifyScribe(UUID matchId, int winnerTeam, MatchState finalState) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("matchId", matchId);
            event.put("winnerTeam", winnerTeam);
            event.put("totalTurns", finalState.getTurnNumber());

            event.put("players", finalState.getPlayers().stream()
                    .map(p -> {
                        Map<String, Object> playerMap = new HashMap<>();
                        playerMap.put("playerId", p.getPlayerId());
                        playerMap.put("team", p.getTeam());
                        playerMap.put("won", p.getTeam() == winnerTeam);
                        playerMap.put("killsDealt", p.getKills());
                        playerMap.put("damageDealt", p.getDamageDealt());
                        playerMap.put("healingDone", p.getHealingDone());
                        return playerMap;
                    }).toList());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            restTemplate.postForObject(scribeUrl + "/api/scribe/game-over",
                    new HttpEntity<>(event, headers), Object.class);
        } catch (Exception e) {
            log.error("Failed to notify Scribe for match {}", matchId, e);
        }
    }
}