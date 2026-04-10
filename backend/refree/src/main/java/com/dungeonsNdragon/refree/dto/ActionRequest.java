package com.dungeonsNdragon.refree.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionRequest {
    private UUID matchId;
    private UUID actorPlayerId;
    private ActionType actionType;
    private UUID targetPlayerId;
    private Integer currentTurnOrder;

    public enum ActionType {
        // All classes
        BASIC_ATTACK,
        // Barbarian
        RAGE_STRIKE, WHIRLWIND, BATTLE_CRY,
        // Knight
        SHIELD_BASH, HEAL, GUARDIAN_AURA,
        // Ranger
        PRECISE_SHOT, BINDING_ARROW, VANISH,
        // Wizard
        ARCANE_BOLT, CHAIN_LIGHTNING, MANA_DRAIN, WEAKEN
    }
}
