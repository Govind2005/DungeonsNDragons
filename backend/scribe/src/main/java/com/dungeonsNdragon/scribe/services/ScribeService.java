package com.dungeonsNdragon.scribe.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

    @Async
    public void processGameOver(GameOverEvent event) {
        log.info("Processing game over: match {} — team {} wins, {} turns",
                event.getMatchId(), event.getWinnerTeam(), event.getTotalTurns());
        try {
            // 1. Calculate XP and Update Vault
            for (GameOverEvent.PlayerResult player : event.getPlayers()) {
                int xpGained = xpCalculator.calculate(player, event.getTotalTurns());
                updatePlayerStats(player.getPlayerId(), player.getWon(), xpGained);
            }

            // 2. Fetch Usernames and Send Battle Log to Vault
            saveBattleLogToVault(event);

            // 3. Refresh the Materialized View
            leaderboardRepo.refreshLeaderboard();
            log.info("Leaderboard refreshed after match {}", event.getMatchId());

        } catch (Exception e) {
            log.error("Scribe failed for match {}: {}", event.getMatchId(), e.getMessage(), e);
        }
    }

    private void saveBattleLogToVault(GameOverEvent event) {
        try {
            // Fetch match state from Vault to get Usernames and Character Classes
            Map<String, Object> state = restTemplate.getForObject(
                    vaultUrl + "/api/vault/matches/" + event.getMatchId() + "/state", Map.class);

            if (state == null || state.get("players") == null) return;

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> players = (List<Map<String, Object>>) state.get("players");

            // Extract up to 4 players and format them
            String[] pInfo = new String[4];
            for (int i = 0; i < Math.min(players.size(), 4); i++) {
                Map<String, Object> p = players.get(i);
                pInfo[i] = p.get("username") + " (" + p.get("characterClass") + ")";
            }

            String winnerStr = (event.getWinnerTeam() != null && event.getWinnerTeam() == 1) ? "blue" : "red";

            // Build JSON payload
            Map<String, Object> logPayload = Map.of(
                    "matchId", event.getMatchId(),
                    "winnerTeam", winnerStr,
                    "player1", pInfo[0] != null ? pInfo[0] : "",
                    "player2", pInfo[1] != null ? pInfo[1] : "",
                    "player3", pInfo[2] != null ? pInfo[2] : "",
                    "player4", pInfo[3] != null ? pInfo[3] : "",
                    "timestamp", Instant.now().toString()
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // POST the log to the Vault
            restTemplate.postForEntity(
                    vaultUrl + "/api/vault/battle-logs",
                    new HttpEntity<>(logPayload, headers),
                    Void.class
            );

            log.info("Battle log sent to Vault for match {}", event.getMatchId());
        } catch (Exception e) {
            log.warn("Could not save battle log to Vault for match {}: {}", event.getMatchId(), e.getMessage());
        }
    }

    // New method to fetch logs from Vault for the Scribe Controller
    public List<Map<String, Object>> getBattleLogsFromVault() {
        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    vaultUrl + "/api/vault/battle-logs",
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch battle logs from Vault: {}", e.getMessage());
            return new ArrayList<>();
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