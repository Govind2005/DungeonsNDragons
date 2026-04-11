package com.dungeonsNdragon.refree.dto;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TurnResult {
    private UUID matchId;
    private int turnNumber;
    private boolean valid;
    private String rejectionReason;
    private UUID actorPlayerId;
    private ActionRequest.ActionType actionType;
    private UUID targetPlayerId;
    private int damageDealt;
    private int healingDone;
    private int manaUsed;
    private int manaDrained;
    private List<EffectApplied> effectsApplied;
    private boolean targetDied;
    private Integer winnerTeam;
    private MatchStateSnapshot stateAfter;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EffectApplied {
        private String effectType;
        private UUID targetPlayerId;
        private int magnitude;
        private int turns;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchStateSnapshot {
        private List<PlayerSnapshot> players;
        private int nextTurnOrder;
        private int turnNumber;
        private String status;
        private Integer winnerTeam;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerSnapshot {
        private UUID playerId;
        private String username;
        private int team;
        private int turnOrder;
        private int hp;
        private int maxHp;
        private int mana;
        private int maxMana;
        private boolean alive;
        private List<String> activeEffects;
        private int kills;
        private int damageDealt;
        private int healingDone;
    }
}
