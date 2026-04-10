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

import java.util.*;
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
            List<MatchState.ActiveEffect> detailedEffects =
                oldPlayer != null && oldPlayer.getEffects() != null
                ? oldPlayer.getEffects().stream()
                    .filter(e -> ps.getActiveEffects().contains(e.getEffectType())).toList()
                : ps.getActiveEffects().stream()
                    .map(et -> MatchState.ActiveEffect.builder().effectType(et).magnitude(1).turnsRemaining(1).build())
                    .toList();
            return MatchState.PlayerState.builder()
                .matchPlayerId(oldPlayer != null ? oldPlayer.getMatchPlayerId() : null)
                .playerId(ps.getPlayerId()).username(ps.getUsername())
                .team(ps.getTeam()).turnOrder(ps.getTurnOrder())
                .characterClass(oldPlayer != null ? oldPlayer.getCharacterClass() : "")
                .hp(ps.getHp()).maxHp(ps.getMaxHp()).mana(ps.getMana()).maxMana(ps.getMaxMana())
                .alive(ps.isAlive()).effects(new ArrayList<>(detailedEffects))
                .build();
        }).toList();
    return MatchState.builder().matchId(old.getMatchId()).status(snap.getStatus())
        .turnNumber(snap.getTurnNumber()).currentTurnOrder(snap.getNextTurnOrder())
        .winnerTeam(snap.getWinnerTeam()).players(new ArrayList<>(players)).build();
}

private void persistTurnToVault(TurnResult result) {
    try {
        Map<String, Object> req = new HashMap<>();
        req.put("matchId", result.getMatchId());
        req.put("actorPlayerId", result.getActorPlayerId());
        req.put("actionType", result.getActionType().name());
        req.put("targetPlayerId", result.getTargetPlayerId() != null ? result.getTargetPlayerId() : null);
        req.put("damageDealt", result.getDamageDealt());
        req.put("manaUsed", result.getManaUsed());
        req.put("effectsApplied", result.getEffectsApplied());
        req.put("stateSnapshot", result.getStateAfter());
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
            .map(p -> Map.of("playerId", p.getPlayerId(), "team", p.getTeam(),
                             "won", p.getTeam() == winnerTeam)).toList());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String scribeUrl = bouncerUrl.replace("8080", "8084");
        restTemplate.postForObject(scribeUrl + "/api/scribe/game-over",
            new HttpEntity<>(event, headers), Object.class);
    } catch (Exception e) {
        log.error("Failed to notify Scribe for match {}: {}", matchId, e.getMessage());
    }
}
}
