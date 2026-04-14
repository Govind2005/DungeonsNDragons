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
        // Universal Base Attack
        BASIC_ATTACK,

        // Barbarian Abilities
        RAGE_STRIKE,
        WHIRLWIND,
        BATTLE_CRY,

        // Knight Abilities
        SHIELD_BASH,
        HEAL,
        GUARDIAN_AURA,

        // Ranger Abilities
        PRECISE_SHOT,
        BINDING_ARROW,
        VANISH,

        // Wizard Abilities
        ARCANE_BOLT,
        CHAIN_LIGHTNING,
        MANA_DRAIN,
        WEAKEN
    }
}