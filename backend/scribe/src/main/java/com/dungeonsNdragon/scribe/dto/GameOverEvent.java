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

    // Change these to Integer just to be safe
    private Integer winnerTeam;
    private Integer totalTurns;

    private List<PlayerResult> players;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerResult {
        private UUID playerId;
        private Integer team; // Changed to Integer
        private Boolean won;  // Changed to Boolean

        // CHANGED THESE TO INTEGER SO THEY CAN SAFELY BE NULL
        private Integer killsDealt;
        private Integer damageDealt;
        private Integer healingDone;
    }
}