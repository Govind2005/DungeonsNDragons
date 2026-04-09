package com.dungeonsNdragon.refree.entities;

import java.io.Serializable;
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
public class MatchState implements Serializable {
    private UUID matchId;
    private String status;
    private int turnNumber;
    private int currentTurnOrder;
    private Integer winnerTeam;
    private List<PlayerState> players;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerState {
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
        private List<ActiveEffect> effects;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActiveEffect {
        private String effectType;
        private int magnitude;
        private int turnsRemaining;
    }

    public PlayerState getPlayerByTurnOrder(int order) {
        return players.stream().filter(p -> p.getTurnOrder() == order).findFirst().orElse(null);
    }

    public PlayerState getPlayerByPlayerId(UUID playerId) {
        return players.stream().filter(p -> p.getPlayerId().equals(playerId)).findFirst().orElse(null);
    }

    public boolean hasEffect(PlayerState player, String effectType) {
        return player.getEffects() != null && player.getEffects().stream()
                .anyMatch(e -> e.getEffectType().equals(effectType));
    }

    public List<PlayerState> getAlivePlayers() {
        return players.stream().filter(PlayerState::isAlive).toList();
    }

    public List<PlayerState> getAliveTeam(int team) {
        return players.stream().filter(p -> p.isAlive() && p.getTeam() == team).toList();
    }
}
