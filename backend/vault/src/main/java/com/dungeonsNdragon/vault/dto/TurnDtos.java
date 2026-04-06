package com.dungeonsNdragon.vault.dto;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class TurnDtos {
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplyTurnRequest {
        private UUID matchId;
        private UUID actorPlayerId;
        private String actionType;
        private UUID targetPlayerId;
        private int damageDealt;
        private int manaUsed;
        private List<EffectApplication> effectsApplied;
        private Object stateSnapshot;
        private int turnNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EffectApplication {
        private String type;
        private UUID targetPlayerId;
        private int magnitude;
        private int turns;
    }
}
