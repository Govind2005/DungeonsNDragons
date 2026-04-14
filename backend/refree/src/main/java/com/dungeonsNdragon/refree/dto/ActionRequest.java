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
        // Universal Ability
        GUARD_AND_GATHER,

        // Barbarian Abilities
        SAVAGE_STRIKE,
        WHIRLWIND,
        EXECUTIONERS_SMASH,
        WAR_CRY,

        // Knight Abilities
        VALIANT_STRIKE,
        SHIELD_BASH,
        VANGUARDS_CHARGE,
        DIVINE_REST,

        // Ranger Abilities
        PRECISE_SHOT,
        PINNING_ARROW,
        HAIL_OF_ARROWS,
        SHADOW_MELD,

        // Wizard Abilities
        ARCANE_BURST,
        MIND_SIPHON,
        CATACLYSM,
        AURA_OF_LIFE
    }
}