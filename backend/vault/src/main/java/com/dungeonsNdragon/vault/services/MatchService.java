package com.dungeonsNdragon.vault.services;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dungeonsNdragon.vault.dto.MatchDtos.CreateMatchRequest;
import com.dungeonsNdragon.vault.dto.MatchDtos.EffectState;
import com.dungeonsNdragon.vault.dto.MatchDtos.MatchPlayerInit;
import com.dungeonsNdragon.vault.dto.MatchDtos.MatchPlayerState;
import com.dungeonsNdragon.vault.dto.MatchDtos.MatchStateResponse;
import com.dungeonsNdragon.vault.dto.TurnDtos.ApplyTurnRequest;
import com.dungeonsNdragon.vault.dto.TurnDtos.EffectApplication;
import com.dungeonsNdragon.vault.entities.Match;
import com.dungeonsNdragon.vault.entities.MatchPlayer;
import com.dungeonsNdragon.vault.entities.Player;
import com.dungeonsNdragon.vault.entities.PlayerEffect;
import com.dungeonsNdragon.vault.entities.TurnLog;
import com.dungeonsNdragon.vault.repositories.MatchPlayerRepositoryBase;
import com.dungeonsNdragon.vault.repositories.MatchRepositoryBase;
import com.dungeonsNdragon.vault.repositories.PlayerEffectRepositoryBase;
import com.dungeonsNdragon.vault.repositories.PlayerRepositoryBase;
import com.dungeonsNdragon.vault.repositories.TurnLogRepositoryBase;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
@Service
@RequiredArgsConstructor
@Slf4j
public class MatchService {
private final MatchRepositoryBase matchRepo;
private final MatchPlayerRepositoryBase matchPlayerRepo;
private final PlayerEffectRepositoryBase effectRepo;
private final TurnLogRepositoryBase turnLogRepo;
private final PlayerRepositoryBase playerRepo;
private final ObjectMapper objectMapper;

private static final Map<MatchPlayer.CharacterClass, int[]> CLASS_STATS = Map.of(
    MatchPlayer.CharacterClass.BARBARIAN, new int[]{150, 60},
    MatchPlayer.CharacterClass.KNIGHT,    new int[]{120, 80},
    MatchPlayer.CharacterClass.RANGER,    new int[]{90,  110},
    MatchPlayer.CharacterClass.WIZARD,    new int[]{80,  140}
);

@Transactional
public Match createMatch(CreateMatchRequest req) {
    Match match = Match.builder().status(Match.MatchStatus.WAITING).build();
    match = matchRepo.save(match);
    for (MatchPlayerInit init : req.getPlayers()) {
        Player player = playerRepo.findById(init.getPlayerId())
            .orElseThrow(() -> new IllegalArgumentException("Player not found: " + init.getPlayerId()));
        int[] stats = CLASS_STATS.get(init.getCharacterClass());
        MatchPlayer mp = MatchPlayer.builder()
            .match(match).player(player).team(init.getTeam())
            .turnOrder(init.getTurnOrder()).characterClass(init.getCharacterClass())
            .hp(stats[0]).maxHp(stats[0]).mana(stats[1]).maxMana(stats[1]).alive(true)
            .build();
        matchPlayerRepo.save(mp);
    }
    log.info("Created match {} with {} players", match.getId(), req.getPlayers().size());
    return match;
}

@Transactional
public Match startMatch(UUID matchId) {
    Match match = getMatchOrThrow(matchId);
    match.setStatus(Match.MatchStatus.IN_PROGRESS);
    match.setStartedAt(Instant.now());
    return matchRepo.save(match);
}

@Transactional(readOnly = true)
public MatchStateResponse getMatchState(UUID matchId) {
    Match match = getMatchOrThrow(matchId);
    List<MatchPlayer> players = matchPlayerRepo.findByMatchIdOrderByTurnOrder(matchId);
    int turnNumber = turnLogRepo.findMaxTurnNumber(matchId).orElse(0);
    
    // THE FIX: Instead of re-calculating turn order (which might differ from Referee)
    // read it from the latest recorded state snapshot in the TurnLog.
    int currentTurnOrder = 1;
    Optional<TurnLog> lastTurn = turnLogRepo.findFirstByMatchIdOrderByTurnNumberDesc(matchId);
    if (lastTurn.isPresent()) {
        Map<String, Object> snapshot = objectMapper.convertValue(lastTurn.get().getStateSnapshot(), Map.class);
        currentTurnOrder = (int) snapshot.getOrDefault("nextTurnOrder", 1);
    } else if (match.getStatus() == Match.MatchStatus.IN_PROGRESS) {
        // If match in progress but no turns yet, it's turn 1
        currentTurnOrder = 1;
    }

    List<MatchPlayerState> playerStates = players.stream()
        .map(mp -> MatchPlayerState.builder()
            .matchPlayerId(mp.getId()).playerId(mp.getPlayer().getId())
            .username(mp.getPlayer().getUsername()).team(mp.getTeam())
            .turnOrder(mp.getTurnOrder()).characterClass(mp.getCharacterClass().name())
            .hp(mp.getHp()).maxHp(mp.getMaxHp()).mana(mp.getMana()).maxMana(mp.getMaxMana())
            .alive(mp.isAlive())
            .effects(mp.getEffects().stream()
                .map(e -> EffectState.builder().effectType(e.getEffectType().name())
                    .magnitude(e.getMagnitude()).turnsRemaining(e.getTurnsRemaining()).build())
                .toList())
            .build())
        .toList();

    return MatchStateResponse.builder()
        .matchId(matchId).status(match.getStatus().name())
        .currentTurnOrder(currentTurnOrder).turnNumber(turnNumber)
        .players(playerStates).winnerTeam(match.getWinnerTeam())
        .build();
}

@Transactional
public MatchStateResponse applyTurnResult(ApplyTurnRequest req) {
    // THE FIX: Sync ALL players' stats (HP, Mana, Alive) from the Referee's snapshot
    // This handles AOE, healing, and complex status effects that manual logic misses.
    if (req.getStateSnapshot() != null) {
        Map<String, Object> snapshot = objectMapper.convertValue(req.getStateSnapshot(), Map.class);
        List<Map<String, Object>> snapshotPlayers = (List<Map<String, Object>>) snapshot.get("players");
        if (snapshotPlayers != null) {
            for (Map<String, Object> sp : snapshotPlayers) {
                UUID pId = UUID.fromString(sp.get("playerId").toString());
                MatchPlayer mp = matchPlayerRepo.findByMatchIdAndPlayerId(req.getMatchId(), pId).orElseThrow();
                matchPlayerRepo.updateStats(mp.getId(), (int)sp.get("hp"), (int)sp.get("mana"), (boolean)sp.get("alive"));
            }
            log.info("Synced stats for {} players from turn snapshot in match {}", snapshotPlayers.size(), req.getMatchId());
        }
    }
    if (req.getEffectsApplied() != null) {
        for (EffectApplication ea : req.getEffectsApplied()) {
            MatchPlayer targetMp = matchPlayerRepo
                .findByMatchIdAndPlayerId(req.getMatchId(), ea.getTargetPlayerId()).orElseThrow();
            effectRepo.save(PlayerEffect.builder()
                .matchPlayer(targetMp)
                .effectType(PlayerEffect.EffectType.valueOf(ea.getType()))
                .magnitude(ea.getMagnitude()).turnsRemaining(ea.getTurns()).build());
        }
    }
    effectRepo.decrementAllTurnsForMatch(req.getMatchId());
    effectRepo.deleteExpiredEffectsForMatch(req.getMatchId());
    TurnLog turnLog = TurnLog.builder()
        .matchId(req.getMatchId()).turnNumber(req.getTurnNumber())
        .actorPlayerId(req.getActorPlayerId()).actionType(req.getActionType())
        .targetPlayerId(req.getTargetPlayerId()).damageDealt(req.getDamageDealt())
        .manaUsed(req.getManaUsed()).effectsApplied(req.getEffectsApplied())
        .stateSnapshot(req.getStateSnapshot()).build();
    turnLogRepo.save(turnLog);
    checkAndApplyWinCondition(req.getMatchId());
    return getMatchState(req.getMatchId());
}

private void checkAndApplyWinCondition(UUID matchId) {
    List<MatchPlayer> alivePlayers = matchPlayerRepo.findAliveByMatchId(matchId);
    long aliveTeam1 = alivePlayers.stream().filter(mp -> mp.getTeam() == 1).count();
    long aliveTeam2 = alivePlayers.stream().filter(mp -> mp.getTeam() == 2).count();
    if (aliveTeam1 == 0 || aliveTeam2 == 0) {
        int winnerTeam = aliveTeam1 > 0 ? 1 : 2;
        Match match = getMatchOrThrow(matchId);
        match.setStatus(Match.MatchStatus.COMPLETED);
        match.setWinnerTeam(winnerTeam);
        match.setEndedAt(Instant.now());
        matchRepo.save(match);
        log.info("Match {} ended — team {} wins", matchId, winnerTeam);
    }
}

@Transactional
public void abandonMatch(UUID matchId) {
    Match match = getMatchOrThrow(matchId);
    match.setStatus(Match.MatchStatus.ABANDONED);
    match.setEndedAt(Instant.now());
    matchRepo.save(match);
}

private Match getMatchOrThrow(UUID matchId) {
    return matchRepo.findById(matchId)
        .orElseThrow(() -> new IllegalArgumentException("Match not found: " + matchId));
}
}
