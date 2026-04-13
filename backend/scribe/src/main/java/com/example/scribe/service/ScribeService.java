package com.example.scribe.service;

import com.example.scribe.client.VaultClient;
import com.example.scribe.dto.MatchDTO;
import com.example.scribe.dto.PlayerDTO;
import com.example.scribe.entity.PlayerProfile;
import com.example.scribe.repository.PlayerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Service
public class ScribeService {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private VaultClient vaultClient;

    @Transactional
    public void processGameOver(String matchId, String winningTeam) {
        log.info("Processing Game Over for Match: {}. Winner: {}", matchId, winningTeam);

        // 1. Fetch the final board from The Vault
        MatchDTO match = vaultClient.getFinishedMatch(matchId);
        Map<String, Map<String, Object>> combatants = (Map<String, Map<String, Object>>) match.getGameState().get("combatants");

        // 2. Loop through all 4 players
        for (Map.Entry<String, Map<String, Object>> entry : combatants.entrySet()) {
            String playerId = entry.getKey();
            String playerTeam = (String) entry.getValue().get("team");

            // 3. Find their profile (or create a new one if it's their first game)
            PlayerProfile profile = playerRepository.findById(playerId)
                    .orElse(new PlayerProfile(playerId));

            // 4. Update the math
            profile.setTotalGames(profile.getTotalGames() + 1);
            if (winningTeam.equalsIgnoreCase(playerTeam)) {
                profile.setWins(profile.getWins() + 1);
                log.info("Player {} won! Adding +1 Win.", playerId);
            } else {
                profile.setLosses(profile.getLosses() + 1);
                log.info("Player {} lost. Adding +1 Loss.", playerId);
            }

            // 5. Save securely to the SQL database
            playerRepository.save(profile);
        }
    }

    public PlayerDTO getPlayerProfile(String playerId) {
        PlayerProfile profile = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found!"));

        PlayerDTO dto = new PlayerDTO();
        dto.setPlayerId(profile.getPlayerId());
        dto.setUsername(profile.getUsername());
        dto.setWins(profile.getWins());
        dto.setLosses(profile.getLosses());
        dto.setTotalGames(profile.getTotalGames());
        return dto;
    }
}