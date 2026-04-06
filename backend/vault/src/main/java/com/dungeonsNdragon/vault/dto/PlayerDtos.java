package com.dungeonsNdragon.vault.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class PlayerDtos {
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreatePlayerRequest {
        private String googleId;
        private String username;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerResponse {
        private UUID id;
        private String googleId;
        private String username;
        private String email;
        private int wins;
        private int losses;
        private int xp;
        private double winRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateStatsRequest {
        private UUID playerId;
        private boolean won;
        private int xpGained;
    }
}