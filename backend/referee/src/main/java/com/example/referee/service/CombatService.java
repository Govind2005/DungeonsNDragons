package com.example.referee.service;

import com.example.referee.client.ScribeClient;
import com.example.referee.client.VaultClient;
import com.example.referee.dto.ActionRequest;
import com.example.referee.dto.MatchDTO;
import com.example.referee.engine.CharacterClass;
import com.example.referee.engine.CharacterFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class CombatService {

    @Autowired
    private VaultClient vaultClient;

    @Autowired
    private ScribeClient scribeClient;

    public MatchDTO calculateTurn(String matchId, ActionRequest request) {
        log.info("Calculating move: {} used {} in match {}", request.getAttackerId(), request.getMoveName(), matchId);

        MatchDTO match = vaultClient.getMatch(matchId);
        Map<String, Map<String, Object>> combatants = (Map<String, Map<String, Object>>) match.getGameState().get("combatants");

        // 1. Setup Attacker, Targets, and Ally
        Map<String, Object> attacker = combatants.get(request.getAttackerId());

        List<Map<String, Object>> targets = new ArrayList<>();
        for (String targetId : request.getTargetIds()) {
            targets.add(combatants.get(targetId));
        }

        String allyId = getAllyId(request.getAttackerId());
        Map<String, Object> ally = combatants.get(allyId);

        // 2. Do the Math
        CharacterClass character = CharacterFactory.getCharacter((String) attacker.get("class"));
        character.executeMove(request.getMoveName(), attacker, targets, ally);

        // 3. Check Win Condition
        int p1Hp = Integer.parseInt(combatants.get("P1").get("hp").toString());
        int p2Hp = Integer.parseInt(combatants.get("P2").get("hp").toString());
        int p3Hp = Integer.parseInt(combatants.get("P3").get("hp").toString());
        int p4Hp = Integer.parseInt(combatants.get("P4").get("hp").toString());

        boolean teamAIsDead = (p1Hp <= 0 && p3Hp <= 0);
        boolean teamBIsDead = (p2Hp <= 0 && p4Hp <= 0);

        if (teamAIsDead || teamBIsDead) {
            match.setStatus("FINISHED");
            String winner = teamAIsDead ? "B" : "A";
            log.warn("💀 GAME OVER! {} wins!", winner);
            scribeClient.reportGameOver(matchId, winner);
        } else {
            // 4. Advance Turn Order (FIXED: Now safely passes both arguments!)
            match.setCurrentTurn(advanceTurn(match.getCurrentTurn(), combatants));
        }

        return vaultClient.saveMatch(match);
    }

    // Helper to find the teammate based on your 2v2 rules
    private String getAllyId(String attackerId) {
        return switch (attackerId) {
            case "P1" -> "P3";
            case "P3" -> "P1";
            case "P2" -> "P4";
            case "P4" -> "P2";
            default -> throw new IllegalArgumentException("Unknown Player ID");
        };
    }

    // The Smart Turn Advancer (Checks for Dead or Bound players)
    private String advanceTurn(String currentTurn, Map<String, Map<String, Object>> combatants) {
        String nextTurn = currentTurn;

        // Loop a maximum of 4 times to find the next valid player
        for (int i = 0; i < 4; i++) {
            nextTurn = switch (nextTurn) {
                case "P1" -> "P2";
                case "P2" -> "P3";
                case "P3" -> "P4";
                case "P4" -> "P1";
                default -> "P1";
            };

            Map<String, Object> nextPlayer = combatants.get(nextTurn);
            int hp = (Integer) nextPlayer.get("hp");

            // Use getOrDefault so it doesn't crash if the player doesn't have a status yet
            String status = (String) nextPlayer.getOrDefault("status", "NORMAL");

            if (hp > 0 && !"BOUND".equalsIgnoreCase(status)) {
                // We found a living, un-trapped player! It is their turn.
                return nextTurn;
            } else if ("BOUND".equalsIgnoreCase(status)) {
                // They were trapped, so we skip them. But we must remove the trap
                // so they can play on the next round!
                nextPlayer.put("status", "NORMAL");
                log.info("{} is BOUND and skips their turn!", nextTurn);
            } else if (hp <= 0) {
                log.info("{} is DEAD and skips their turn!", nextTurn);
            }
        }
        return nextTurn; // Fallback just in case
    }
}