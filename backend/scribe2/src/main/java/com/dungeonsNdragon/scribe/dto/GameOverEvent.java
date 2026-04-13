package com.dungeonsNdragon.scribe.dto;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameOverEvent {
    private UUID matchId;
    private int winnerTeam;
    private int totalTurns;
    private List<PlayerResult> players;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerResult {
        private UUID playerId;
        private int team;
        private boolean won;
        private int killsDealt;
        private int damageDealt;
        private int healingDone;
    }
}
