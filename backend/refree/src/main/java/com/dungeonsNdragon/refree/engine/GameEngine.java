package com.dungeonsNdragon.refree.engine;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.dungeonsNdragon.refree.dto.ActionRequest;
import com.dungeonsNdragon.refree.dto.ActionRequest.ActionType;
import com.dungeonsNdragon.refree.dto.TurnResult;
import com.dungeonsNdragon.refree.dto.TurnResult.EffectApplied;
import com.dungeonsNdragon.refree.entities.MatchState;
import com.dungeonsNdragon.refree.entities.MatchState.ActiveEffect;
import com.dungeonsNdragon.refree.entities.MatchState.PlayerState;

import lombok.extern.slf4j.Slf4j;

/**
 * GameEngine — pure stateless computation. No I/O, no Spring dependencies
 * except @Component.
 * Takes MatchState + ActionRequest → returns TurnResult.
 */
@Component
@Slf4j
public class GameEngine {
    private static final int BARBARIAN_BASE_DMG = 35;
    private static final int KNIGHT_BASE_DMG = 25;
    private static final int RANGER_BASE_DMG = 28;
    private static final int WIZARD_BASE_DMG = 38;
    private static final int MANA_BASIC_ATTACK = 0;
    private static final int MANA_RAGE_STRIKE = 25;
    private static final int MANA_WHIRLWIND = 40;
    private static final int MANA_BATTLE_CRY = 20;
    private static final int MANA_SHIELD_BASH = 20;
    private static final int MANA_HEAL = 30;
    private static final int MANA_GUARDIAN_AURA = 35;
    private static final int MANA_PRECISE_SHOT = 15;
    private static final int MANA_BINDING_ARROW = 25;
    private static final int MANA_VANISH = 20;
    private static final int MANA_ARCANE_BOLT = 30;
    private static final int MANA_CHAIN_LIGHTNING = 45;
    private static final int MANA_MANA_DRAIN = 20;
    private static final int MANA_WEAKEN = 25;
    private static final int MANA_REGEN_PER_TURN = 10;

    public TurnResult compute(MatchState state, ActionRequest action) {
        PlayerState actor = state.getPlayerByPlayerId(action.getActorPlayerId());
        PlayerState target = action.getTargetPlayerId() != null
                ? state.getPlayerByPlayerId(action.getTargetPlayerId())
                : null;
        String rejection = validate(state, actor, target, action);
        if (rejection != null) {
            return TurnResult.builder()
                    .matchId(state.getMatchId()).turnNumber(state.getTurnNumber())
                    .valid(false).rejectionReason(rejection)
                    .actorPlayerId(action.getActorPlayerId()).actionType(action.getActionType())
                    .build();
        }

        MatchState newState = deepCopyState(state);
        PlayerState newActor = newState.getPlayerByPlayerId(action.getActorPlayerId());
        PlayerState newTarget = target != null ? newState.getPlayerByPlayerId(action.getTargetPlayerId()) : null;

        List<EffectApplied> effectsApplied = new ArrayList<>();
        int damageDealt = 0, healingDone = 0, manaUsed = 0, manaDrained = 0;

        switch (action.getActionType()) {
            case BASIC_ATTACK -> {
                damageDealt = resolveAttack(newActor, newTarget, 1.0);
                manaUsed = MANA_BASIC_ATTACK;
            }
            case RAGE_STRIKE -> {
                damageDealt = resolveAttack(newActor, newTarget, 1.5);
                manaUsed = MANA_RAGE_STRIKE;
            }
            case WHIRLWIND -> {
                for (PlayerState e : newState.getAliveTeam(enemyTeam(newActor.getTeam()))) {
                    int d = resolveAttack(newActor, e, 0.6);
                    applyDamage(newActor, e, d); // UPDATED to track kills
                    damageDealt += d;
                }
                manaUsed = MANA_WHIRLWIND;
            }
            case BATTLE_CRY -> {
                addEffect(newActor, effectsApplied, "ATTACK_BUFF", 2, 2);
                manaUsed = MANA_BATTLE_CRY;
            }
            case SHIELD_BASH -> {
                damageDealt = resolveAttack(newActor, newTarget, 0.8);
                addEffect(newTarget, effectsApplied, "BIND", 1, 1);
                manaUsed = MANA_SHIELD_BASH;
            }
            case HEAL -> {
                PlayerState healTarget = newTarget != null ? newTarget : newActor;
                int healAmt = Math.min(30, healTarget.getMaxHp() - healTarget.getHp());
                healTarget.setHp(healTarget.getHp() + healAmt);
                healingDone = healAmt;
                manaUsed = MANA_HEAL;
            }
            case GUARDIAN_AURA -> {
                for (PlayerState ally : newState.getAliveTeam(newActor.getTeam()))
                    addEffect(ally, effectsApplied, "DEFENSE_BUFF", 30, 2);
                manaUsed = MANA_GUARDIAN_AURA;
            }
            case PRECISE_SHOT -> {
                damageDealt = resolveAttackIgnoreInvisible(newActor, newTarget);
                manaUsed = MANA_PRECISE_SHOT;
            }
            case BINDING_ARROW -> {
                damageDealt = resolveAttack(newActor, newTarget, 0.5);
                addEffect(newTarget, effectsApplied, "BIND", 1, 2);
                manaUsed = MANA_BINDING_ARROW;
            }
            case VANISH -> {
                addEffect(newActor, effectsApplied, "INVISIBLE", 1, 1);
                manaUsed = MANA_VANISH;
            }
            case ARCANE_BOLT -> {
                damageDealt = resolveAttack(newActor, newTarget, 1.0);
                manaUsed = MANA_ARCANE_BOLT;
            }
            case CHAIN_LIGHTNING -> {
                for (PlayerState e : newState.getAliveTeam(enemyTeam(newActor.getTeam()))) {
                    int d = resolveAttack(newActor, e, 0.5);
                    applyDamage(newActor, e, d); // UPDATED to track kills
                    damageDealt += d;
                }
                manaUsed = MANA_CHAIN_LIGHTNING;
            }
            case MANA_DRAIN -> {
                int drained = Math.min(30, newTarget.getMana());
                newTarget.setMana(newTarget.getMana() - drained);
                manaDrained = drained;
                damageDealt = drained / 2;
                applyDamage(newActor, newTarget, damageDealt); // UPDATED to track kills
                manaUsed = MANA_MANA_DRAIN;
            }
            case WEAKEN -> {
                addEffect(newTarget, effectsApplied, "ATTACK_DEBUFF", 30, 2);
                manaUsed = MANA_WEAKEN;
            }
        }

        boolean wasAoe = isAoe(action.getActionType());
        if (!wasAoe && damageDealt > 0 && newTarget != null
                && action.getActionType() != ActionType.MANA_DRAIN) {
            applyDamage(newActor, newTarget, damageDealt); // UPDATED to track kills
        }

        // ADDED: Update the running totals for damage and healing
        newActor.setDamageDealt(newActor.getDamageDealt() + damageDealt);
        newActor.setHealingDone(newActor.getHealingDone() + healingDone);

        int newMana = Math.min(newActor.getMaxMana(), newActor.getMana() - manaUsed + MANA_REGEN_PER_TURN);
        newActor.setMana(Math.max(0, newMana));

        tickEffects(newState);

        int nextTurnOrder = computeNextTurnOrder(newState, newActor.getTurnOrder());
        newState.setCurrentTurnOrder(nextTurnOrder);
        newState.setTurnNumber(newState.getTurnNumber() + 1);

        Integer winnerTeam = checkWinCondition(newState);
        if (winnerTeam != null) {
            newState.setStatus("COMPLETED");
            newState.setWinnerTeam(winnerTeam);
        }

        return TurnResult.builder()
                .matchId(state.getMatchId()).turnNumber(state.getTurnNumber() + 1).valid(true)
                .actorPlayerId(action.getActorPlayerId()).actionType(action.getActionType())
                .targetPlayerId(action.getTargetPlayerId()).damageDealt(damageDealt)
                .healingDone(healingDone).manaUsed(manaUsed).manaDrained(manaDrained)
                .effectsApplied(effectsApplied)
                .targetDied(newTarget != null && !newTarget.isAlive())
                .winnerTeam(winnerTeam).stateAfter(buildSnapshot(newState))
                .build();
    }

    private String validate(MatchState state, PlayerState actor, PlayerState target, ActionRequest action) {
        if (actor == null)
            return "Actor not found in match";
        if (!actor.isAlive())
            return "Actor is dead";
        if (actor.getTurnOrder() != state.getCurrentTurnOrder())
            return "Not your turn (Server says: " + state.getCurrentTurnOrder() + ", You have: " + actor.getTurnOrder() + ")";
        if (action.getCurrentTurnOrder() != null && action.getCurrentTurnOrder() != state.getCurrentTurnOrder())
            return "Turn synchronization mismatch (State: " + state.getCurrentTurnOrder() + ", Requested: " + action.getCurrentTurnOrder() + ")";
        if (!"IN_PROGRESS".equals(state.getStatus()))
            return "Match is not in progress";
        if (state.hasEffect(actor, "BIND"))
            return "You are bound and cannot act this turn";
        boolean needsTarget = isTargeted(action.getActionType());
        if (needsTarget && target == null)
            return "Target required for this action";
        if (needsTarget && !target.isAlive())
            return "Target is already dead";
        if (needsTarget && isDamageAction(action.getActionType()) && target.getTeam() == actor.getTeam())
            return "Cannot target own teammate with damage";
        int manaCost = getManaCost(action.getActionType());
        if (actor.getMana() < manaCost)
            return "Not enough mana (" + actor.getMana() + "/" + manaCost + ")";
        if (!isClassAllowed(actor.getCharacterClass(), action.getActionType()))
            return "Your class cannot use " + action.getActionType();
        return null;
    }

    private int resolveAttack(PlayerState actor, PlayerState target, double multiplier) {
        if (target == null)
            return 0;
        if (isInvisible(target)) {
            removeEffect(target, "INVISIBLE");
            return 0;
        }
        return computeDamage(actor, target, multiplier);
    }

    private int resolveAttackIgnoreInvisible(PlayerState actor, PlayerState target) {
        if (target == null)
            return 0;
        removeEffect(target, "INVISIBLE");
        return computeDamage(actor, target, 1.0);
    }

    private int computeDamage(PlayerState actor, PlayerState target, double multiplier) {
        double raw = getClassBaseDamage(actor.getCharacterClass()) * multiplier;
        double attackMod = getEffectMagnitude(actor, "ATTACK_BUFF") - getEffectMagnitude(actor, "ATTACK_DEBUFF");
        raw = raw * (1.0 + attackMod / 100.0);
        double defenseMod = getEffectMagnitude(target, "DEFENSE_BUFF");
        raw = raw / (1.0 + defenseMod / 100.0);
        return Math.max(1, (int) Math.round(raw));
    }

    // UPDATED: Now checks if the target dies so it can award a kill!
    private void applyDamage(PlayerState actor, PlayerState target, int damage) {
        boolean wasAlive = target.isAlive();
        int newHp = Math.max(0, target.getHp() - damage);
        target.setHp(newHp);
        target.setAlive(newHp > 0);

        // If they were alive, but now they are dead, award the kill
        if (wasAlive && !target.isAlive() && actor != null) {
            actor.setKills(actor.getKills() + 1);
        }
    }

    private void addEffect(PlayerState target, List<EffectApplied> log,
                           String type, int magnitude, int turns) {
        if (target.getEffects() == null)
            target.setEffects(new ArrayList<>());
        target.getEffects().removeIf(e -> e.getEffectType().equals(type));
        target.getEffects().add(ActiveEffect.builder()
                .effectType(type).magnitude(magnitude).turnsRemaining(turns).build());
        log.add(EffectApplied.builder()
                .effectType(type).targetPlayerId(target.getPlayerId()).magnitude(magnitude).turns(turns).build());
    }

    private void removeEffect(PlayerState target, String type) {
        if (target.getEffects() != null)
            target.getEffects().removeIf(e -> e.getEffectType().equals(type));
    }

    private void tickEffects(MatchState state) {
        for (PlayerState p : state.getPlayers()) {
            if (p.getEffects() == null)
                continue;
            p.getEffects().forEach(e -> e.setTurnsRemaining(e.getTurnsRemaining() - 1));
            p.getEffects().removeIf(e -> e.getTurnsRemaining() <= 0);
        }
    }

    private boolean isInvisible(PlayerState p) {
        return p.getEffects() != null && p.getEffects().stream()
                .anyMatch(e -> "INVISIBLE".equals(e.getEffectType()));
    }

    private double getEffectMagnitude(PlayerState p, String type) {
        if (p.getEffects() == null)
            return 0;
        return p.getEffects().stream().filter(e -> e.getEffectType().equals(type))
                .mapToInt(ActiveEffect::getMagnitude).sum();
    }

    private int computeNextTurnOrder(MatchState state, int currentOrder) {
        List<PlayerState> candidates = state.getPlayers().stream()
                .filter(PlayerState::isAlive)
                .filter(p -> !state.hasEffect(p, "BIND"))
                .sorted((a, b) -> Integer.compare(a.getTurnOrder(), b.getTurnOrder()))
                .toList();
        if (candidates.isEmpty())
            return currentOrder;
        for (PlayerState p : candidates)
            if (p.getTurnOrder() > currentOrder)
                return p.getTurnOrder();
        return candidates.get(0).getTurnOrder();
    }

    private Integer checkWinCondition(MatchState state) {
        if (state.getAliveTeam(1).isEmpty())
            return 2;
        if (state.getAliveTeam(2).isEmpty())
            return 1;
        return null;
    }

    private int getClassBaseDamage(String cls) {
        return switch (cls) {
            case "BARBARIAN" -> BARBARIAN_BASE_DMG;
            case "KNIGHT" -> KNIGHT_BASE_DMG;
            case "RANGER" -> RANGER_BASE_DMG;
            case "WIZARD" -> WIZARD_BASE_DMG;
            default -> 20;
        };
    }

    private boolean isClassAllowed(String cls, ActionType action) {
        return switch (action) {
            case RAGE_STRIKE, WHIRLWIND, BATTLE_CRY -> "BARBARIAN".equals(cls);
            case SHIELD_BASH, HEAL, GUARDIAN_AURA -> "KNIGHT".equals(cls);
            case PRECISE_SHOT, BINDING_ARROW, VANISH -> "RANGER".equals(cls);
            case ARCANE_BOLT, CHAIN_LIGHTNING, MANA_DRAIN, WEAKEN -> "WIZARD".equals(cls);
            case BASIC_ATTACK -> true;
        };
    }

    private int getManaCost(ActionType action) {
        return switch (action) {
            case BASIC_ATTACK -> MANA_BASIC_ATTACK;
            case RAGE_STRIKE -> MANA_RAGE_STRIKE;
            case WHIRLWIND -> MANA_WHIRLWIND;
            case BATTLE_CRY -> MANA_BATTLE_CRY;
            case SHIELD_BASH -> MANA_SHIELD_BASH;
            case HEAL -> MANA_HEAL;
            case GUARDIAN_AURA -> MANA_GUARDIAN_AURA;
            case PRECISE_SHOT -> MANA_PRECISE_SHOT;
            case BINDING_ARROW -> MANA_BINDING_ARROW;
            case VANISH -> MANA_VANISH;
            case ARCANE_BOLT -> MANA_ARCANE_BOLT;
            case CHAIN_LIGHTNING -> MANA_CHAIN_LIGHTNING;
            case MANA_DRAIN -> MANA_MANA_DRAIN;
            case WEAKEN -> MANA_WEAKEN;
        };
    }

    private boolean isTargeted(ActionType a) {
        return switch (a) {
            case WHIRLWIND, CHAIN_LIGHTNING, BATTLE_CRY, VANISH, GUARDIAN_AURA -> false;
            default -> true;
        };
    }

    private boolean isDamageAction(ActionType a) {
        return switch (a) {
            case BASIC_ATTACK, RAGE_STRIKE, WHIRLWIND, SHIELD_BASH,
                 PRECISE_SHOT, BINDING_ARROW, ARCANE_BOLT, CHAIN_LIGHTNING, MANA_DRAIN ->
                    true;
            default -> false;
        };
    }

    private boolean isAoe(ActionType a) {
        return a == ActionType.WHIRLWIND || a == ActionType.CHAIN_LIGHTNING || a == ActionType.GUARDIAN_AURA;
    }

    private int enemyTeam(int team) {
        return team == 1 ? 2 : 1;
    }

    private MatchState deepCopyState(MatchState original) {
        List<PlayerState> playersCopy = original.getPlayers().stream()
                .map(p -> {
                    List<ActiveEffect> effectsCopy = p.getEffects() == null ? new ArrayList<>()
                            : new ArrayList<>(p.getEffects().stream()
                            .map(e -> ActiveEffect.builder().effectType(e.getEffectType())
                                    .magnitude(e.getMagnitude()).turnsRemaining(e.getTurnsRemaining()).build())
                            .toList());
                    return PlayerState.builder()
                            .matchPlayerId(p.getMatchPlayerId()).playerId(p.getPlayerId())
                            .username(p.getUsername()).team(p.getTeam()).turnOrder(p.getTurnOrder())
                            .characterClass(p.getCharacterClass()).hp(p.getHp()).maxHp(p.getMaxHp())
                            .mana(p.getMana()).maxMana(p.getMaxMana()).alive(p.isAlive()).effects(effectsCopy)

                            // ADDED: Make sure these don't get erased between turns!
                            .kills(p.getKills())
                            .damageDealt(p.getDamageDealt())
                            .healingDone(p.getHealingDone())
                            .build();
                }).toList();
        return MatchState.builder().matchId(original.getMatchId()).status(original.getStatus())
                .turnNumber(original.getTurnNumber()).currentTurnOrder(original.getCurrentTurnOrder())
                .winnerTeam(original.getWinnerTeam()).players(new ArrayList<>(playersCopy)).build();
    }

    private TurnResult.MatchStateSnapshot buildSnapshot(MatchState state) {
        return TurnResult.MatchStateSnapshot.builder()
                .players(state.getPlayers().stream()
                        .map(p -> TurnResult.PlayerSnapshot.builder()
                                .playerId(p.getPlayerId()).username(p.getUsername()).team(p.getTeam())
                                .turnOrder(p.getTurnOrder()).hp(p.getHp()).maxHp(p.getMaxHp())
                                .mana(p.getMana()).maxMana(p.getMaxMana()).alive(p.isAlive())
                                .activeEffects(p.getEffects() == null ? List.of()
                                        : p.getEffects().stream().map(ActiveEffect::getEffectType).toList())

                                // ADD THESE THREE LINES:
                                .kills(p.getKills())
                                .damageDealt(p.getDamageDealt())
                                .healingDone(p.getHealingDone())

                                .build())
                        .toList())
                .nextTurnOrder(state.getCurrentTurnOrder()).turnNumber(state.getTurnNumber())
                .status(state.getStatus()).winnerTeam(state.getWinnerTeam())
                .build();
    }
}