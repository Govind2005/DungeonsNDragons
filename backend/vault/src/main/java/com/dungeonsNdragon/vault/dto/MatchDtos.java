package com.dungeonsNdragon.vault.dto;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class MatchDtos {
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateMatchRequest {
        private List<MatchPlayerInit> players;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchPlayerInit {
        private UUID playerId;
        private int team;
        private int turnOrder;
        private com.dungeonsNdragon.vault.entities.MatchPlayer.CharacterClass characterClass;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchStateResponse {
        private UUID matchId;
        private String status;
        private int currentTurnOrder;
        private int turnNumber;
        private List<MatchPlayerState> players;
        private Integer winnerTeam;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchPlayerState {
        private UUID matchPlayerId;
        private UUID playerId;
        private String username;
        private int team;
        private int turnOrder;
        private String characterClass;
        private int hp;
        private int maxHp;
        private int mana;
        private int maxMana;
        private boolean alive;
        private List<EffectState> effects;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EffectState {
        private String effectType;
        private int magnitude;
        private int turnsRemaining;
    }
}
