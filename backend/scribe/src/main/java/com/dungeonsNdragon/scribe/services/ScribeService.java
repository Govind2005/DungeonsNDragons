package com.dungeonsNdragon.scribe.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.dungeonsNdragon.scribe.dto.GameOverEvent;
import com.dungeonsNdragon.scribe.repositories.LeaderboardRepository;


@Service
@RequiredArgsConstructor
@Slf4j
public class ScribeService {
private final XpCalculator xpCalculator;
private final LeaderboardRepository leaderboardRepo;
private final RestTemplate restTemplate;

@Value("${services.vault.url}")
private String vaultUrl;

/**
 * Entire method runs in background thread (ThreadPoolTaskExecutor).
 * Referee's HTTP call to /api/scribe/game-over returns 202 immediately.
 */
@Async
public void processGameOver(GameOverEvent event) {
    log.info("Processing game over: match {} — team {} wins, {} turns",
        event.getMatchId(), event.getWinnerTeam(), event.getTotalTurns());
    try {
        List<GameOverEvent.PlayerResult> players = enrichWithMatchStats(event);
        for (GameOverEvent.PlayerResult player : players) {
            int xpGained = xpCalculator.calculate(player, event.getTotalTurns());
            updatePlayerStats(player.getPlayerId(), player.isWon(), xpGained);
        }
        leaderboardRepo.refreshLeaderboard();
        log.info("Leaderboard refreshed after match {}", event.getMatchId());
    } catch (Exception e) {
        log.error("Scribe failed for match {}: {}", event.getMatchId(), e.getMessage(), e);
    }
}

private List<GameOverEvent.PlayerResult> enrichWithMatchStats(GameOverEvent event) {
    try {
        restTemplate.getForObject(
            vaultUrl + "/api/vault/matches/" + event.getMatchId() + "/state", Map.class);
        return event.getPlayers();
    } catch (Exception e) {
        log.warn("Could not enrich stats from Vault: {}", e.getMessage());
        return event.getPlayers();
    }
}

private void updatePlayerStats(UUID playerId, boolean won, int xpGained) {
    try {
        Map<String, Object> req = Map.of("playerId", playerId, "won", won, "xpGained", xpGained);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        restTemplate.postForEntity(
            vaultUrl + "/api/vault/players/stats", new HttpEntity<>(req, headers), Void.class);
        log.debug("Updated player {} — won={}, xp+{}", playerId, won, xpGained);
    } catch (Exception e) {
        log.error("Failed to update stats for player {}: {}", playerId, e.getMessage());
    }
}

public List<Map<String, Object>> getLeaderboard(int page, int pageSize) {
    int offset = page * pageSize;
    List<Object[]> rows = leaderboardRepo.findTopPlayers(pageSize, offset);
    List<Map<String, Object>> result = new ArrayList<>();
    for (int i = 0; i < rows.size(); i++) {
        Object[] row = rows.get(i);
        result.add(Map.of(
            "rank", offset + i + 1, "playerId", row[0], "username", row[1],
            "wins", row[2], "losses", row[3], "xp", row[4], "winRate", row[5]));
    }
    return result;
}
}
