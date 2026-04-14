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
 * GameEngine — pure stateless computation. No I/O, no Spring dependencies.
 * Includes strict null-scrubbing to prevent Vault Enum crashes.
 */
@Component
@Slf4j
public class GameEngine {

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

        String moveName = action.getActionType().name();

        switch (moveName) {
            case "BASIC_ATTACK" -> {
                manaUsed = 0;
                damageDealt = resolveAttack(newActor, newTarget, 1.0);
            }
            // ================== BARBARIAN ==================
            case "RAGE_STRIKE" -> {
                manaUsed = 25;
                damageDealt = resolveAttack(newActor, newTarget, 1.4);
            }
            case "WHIRLWIND" -> {
                manaUsed = 40;
                for (PlayerState e : newState.getAliveTeam(enemyTeam(newActor.getTeam()))) {
                    int d = resolveAttack(newActor, e, 0.6);
                    applyDamage(newActor, e, d);
                    damageDealt += d;
                }
            }
            case "BATTLE_CRY" -> {
                manaUsed = 20;
                addEffect(newActor, effectsApplied, "ATTACK_BUFF", 25, 2);
            }

            // ================== KNIGHT ==================
            case "SHIELD_BASH" -> {
                manaUsed = 20;
                damageDealt = resolveAttack(newActor, newTarget, 0.8);
                addEffect(newTarget, effectsApplied, "BIND", 1, 1);
            }
            case "HEAL" -> {
                manaUsed = 30;
                PlayerState healTarget = newTarget != null ? newTarget : newActor;
                int healAmt = Math.min(30, healTarget.getMaxHp() - healTarget.getHp());
                healTarget.setHp(healTarget.getHp() + healAmt);
                healingDone += healAmt;
            }
            case "GUARDIAN_AURA" -> {
                manaUsed = 35;
                for (PlayerState ally : newState.getAliveTeam(newActor.getTeam())) {
                    addEffect(ally, effectsApplied, "DEFENSE_BUFF", 30, 2);
                }
            }

            // ================== RANGER ==================
            case "PRECISE_SHOT" -> {
                manaUsed = 15;
                damageDealt = resolveAttackIgnoreInvisible(newActor, newTarget, 1.0);
            }
            case "BINDING_ARROW" -> {
                manaUsed = 30;
                damageDealt = resolveAttack(newActor, newTarget, 0.5);
                addEffect(newTarget, effectsApplied, "BIND", 1, 1);
            }
            case "VANISH" -> {
                manaUsed = 20;
                addEffect(newActor, effectsApplied, "INVISIBLE", 1, 2);
            }

            // ================== WIZARD ==================
            case "ARCANE_BOLT" -> {
                manaUsed = 30;
                damageDealt = resolveAttack(newActor, newTarget, 1.3);
            }
            case "CHAIN_LIGHTNING" -> {
                manaUsed = 45;
                for (PlayerState e : newState.getAliveTeam(enemyTeam(newActor.getTeam()))) {
                    int d = resolveAttack(newActor, e, 0.5);
                    applyDamage(newActor, e, d);
                    damageDealt += d;
                }
            }
            case "MANA_DRAIN" -> {
                manaUsed = 20;
                int drained = Math.min(30, newTarget.getMana());
                newTarget.setMana(Math.max(0, newTarget.getMana() - drained));
                manaDrained += drained;
                damageDealt = drained / 2;
                applyDamage(newActor, newTarget, damageDealt);
            }
            case "WEAKEN" -> {
                manaUsed = 25;
                addEffect(newTarget, effectsApplied, "ATTACK_DEBUFF", 30, 2);
            }

            default -> {
                damageDealt = resolveAttack(newActor, newTarget, 1.0);
                manaUsed = 0;
            }
        }

        if (!"VANISH".equals(moveName)) {
            removeEffect(newActor, "INVISIBLE");
        }

        boolean wasAoe = isAoe(moveName);
        if (!wasAoe && damageDealt > 0 && newTarget != null && !"MANA_DRAIN".equals(moveName)) {
            applyDamage(newActor, newTarget, damageDealt);
        }

        newActor.setDamageDealt(newActor.getDamageDealt() + damageDealt);
        newActor.setHealingDone(newActor.getHealingDone() + healingDone);

        int newMana = Math.min(newActor.getMaxMana(), newActor.getMana() - manaUsed + MANA_REGEN_PER_TURN);
        newActor.setMana(Math.max(0, newMana));

        tickPlayerEffects(newActor);

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
        if (actor == null) return "Actor not found in match";
        if (!actor.isAlive()) return "Actor is dead";
        if (actor.getTurnOrder() != state.getCurrentTurnOrder()) return "Not your turn";
        if (!"IN_PROGRESS".equals(state.getStatus())) return "Match is not in progress";
        if (state.hasEffect(actor, "BIND")) return "You are bound and cannot act this turn";

        String moveName = action.getActionType().name();
        boolean needsTarget = isTargeted(moveName);

        if (needsTarget && target == null) return "Target required for this action";
        if (needsTarget && !target.isAlive()) return "Target is already dead";
        if (needsTarget && isDamageAction(moveName) && target.getTeam() == actor.getTeam())
            return "Cannot target own teammate with damage";

        int manaCost = getManaCost(moveName);
        if (actor.getMana() < manaCost) return "Not enough mana";
        if (!isClassAllowed(actor.getCharacterClass(), moveName)) return "Your class cannot use " + moveName;
        return null;
    }

    private int resolveAttack(PlayerState actor, PlayerState target, double multiplier) {
        if (target == null) return 0;
        if (isInvisible(target)) {
            removeEffect(target, "INVISIBLE");
            return 0;
        }
        return computeDamage(actor, target, multiplier);
    }

    private int resolveAttackIgnoreInvisible(PlayerState actor, PlayerState target, double multiplier) {
        if (target == null) return 0;
        removeEffect(target, "INVISIBLE");
        return computeDamage(actor, target, multiplier);
    }

    private int computeDamage(PlayerState actor, PlayerState target, double multiplier) {
        double rawDamage = getClassBaseDamage(actor.getCharacterClass()) * multiplier;
        double attackMod = getEffectMagnitude(actor, "ATTACK_BUFF") - getEffectMagnitude(actor, "ATTACK_DEBUFF");
        double modifiedDamage = rawDamage * (1.0 + (attackMod / 100.0));
        double defenseMod = getEffectMagnitude(target, "DEFENSE_BUFF");
        double finalDamage = modifiedDamage / (1.0 + (defenseMod / 100.0));
        return Math.max(1, (int) Math.round(finalDamage));
    }

    private int getClassBaseDamage(String cls) {
        if (cls == null) return 20;
        return switch (cls.toUpperCase()) {
            case "BARBARIAN" -> 35;
            case "KNIGHT" -> 25;
            case "RANGER" -> 28;
            case "WIZARD" -> 38;
            default -> 20;
        };
    }

    private void applyDamage(PlayerState actor, PlayerState target, int damage) {
        boolean wasAlive = target.isAlive();
        int newHp = Math.max(0, target.getHp() - damage);
        target.setHp(newHp);
        target.setAlive(newHp > 0);

        if (wasAlive && !target.isAlive() && actor != null) {
            actor.setKills(actor.getKills() + 1);
        }
    }

    private void addEffect(PlayerState target, List<EffectApplied> log, String type, int magnitude, int turns) {
        if (target.getEffects() == null) target.setEffects(new ArrayList<>());
        target.getEffects().removeIf(e -> e.getEffectType() == null || e.getEffectType().equals(type));
        target.getEffects().add(ActiveEffect.builder()
                .effectType(type).magnitude(magnitude).turnsRemaining(turns).build());
        log.add(EffectApplied.builder()
                .effectType(type).targetPlayerId(target.getPlayerId()).magnitude(magnitude).turns(turns).build());
    }

    private void removeEffect(PlayerState target, String type) {
        if (target.getEffects() != null)
            target.getEffects().removeIf(e -> e.getEffectType() != null && e.getEffectType().equals(type));
    }

    private void tickPlayerEffects(PlayerState p) {
        if (p.getEffects() == null) return;
        p.getEffects().forEach(e -> e.setTurnsRemaining(e.getTurnsRemaining() - 1));
        p.getEffects().removeIf(e -> e.getTurnsRemaining() <= 0);
    }

    private boolean isInvisible(PlayerState p) {
        return p.getEffects() != null && p.getEffects().stream()
                .anyMatch(e -> "INVISIBLE".equals(e.getEffectType()));
    }

    private double getEffectMagnitude(PlayerState p, String type) {
        if (p.getEffects() == null) return 0;
        return p.getEffects().stream().filter(e -> type.equals(e.getEffectType()))
                .mapToInt(ActiveEffect::getMagnitude).sum();
    }

    private int computeNextTurnOrder(MatchState state, int currentOrder) {
        int nextOrder = currentOrder;
        int playerCount = state.getPlayers().size();

        for (int i = 0; i < playerCount; i++) {
            nextOrder = findNextInSequence(state, nextOrder);
            PlayerState nextPlayer = state.getPlayerByTurnOrder(nextOrder);

            if (nextPlayer == null || !nextPlayer.isAlive()) {
                continue;
            }

            if (state.hasEffect(nextPlayer, "BIND")) {
                log.info("Player {} is bound, skipping turn.", nextPlayer.getUsername());
                tickPlayerEffects(nextPlayer);
                continue;
            }

            return nextOrder;
        }

        return nextOrder;
    }

    private int findNextInSequence(MatchState state, int currentOrder) {
        List<PlayerState> all = state.getPlayers().stream()
                .sorted((a, b) -> Integer.compare(a.getTurnOrder(), b.getTurnOrder()))
                .toList();
        if (all.isEmpty()) return currentOrder;

        for (PlayerState p : all) {
            if (p.getTurnOrder() > currentOrder)
                return p.getTurnOrder();
        }
        return all.get(0).getTurnOrder();
    }

    private Integer checkWinCondition(MatchState state) {
        if (state.getAliveTeam(1).isEmpty()) return 2;
        if (state.getAliveTeam(2).isEmpty()) return 1;
        return null;
    }

    private boolean isClassAllowed(String cls, String moveName) {
        if ("BASIC_ATTACK".equals(moveName)) return true;
        if (cls == null) return false;
        return switch (cls.toUpperCase()) {
            case "BARBARIAN" -> List.of("RAGE_STRIKE", "WHIRLWIND", "BATTLE_CRY").contains(moveName);
            case "KNIGHT" -> List.of("SHIELD_BASH", "HEAL", "GUARDIAN_AURA").contains(moveName);
            case "RANGER" -> List.of("PRECISE_SHOT", "BINDING_ARROW", "VANISH").contains(moveName);
            case "WIZARD" -> List.of("ARCANE_BOLT", "CHAIN_LIGHTNING", "MANA_DRAIN", "WEAKEN").contains(moveName);
            default -> false;
        };
    }

    private int getManaCost(String moveName) {
        return switch (moveName) {
            case "BASIC_ATTACK" -> 0;
            case "PRECISE_SHOT" -> 15;
            case "BATTLE_CRY", "VANISH", "MANA_DRAIN" -> 20;
            case "SHIELD_BASH", "WEAKEN" -> 25;
            case "HEAL", "BINDING_ARROW", "ARCANE_BOLT" -> 30;
            case "RAGE_STRIKE", "GUARDIAN_AURA" -> 35;
            case "WHIRLWIND" -> 40;
            case "CHAIN_LIGHTNING" -> 45;
            default -> 0;
        };
    }

    private boolean isTargeted(String a) {
        return switch (a) {
            case "WHIRLWIND", "BATTLE_CRY", "GUARDIAN_AURA", "VANISH", "CHAIN_LIGHTNING" -> false;
            default -> true;
        };
    }

    private boolean isDamageAction(String a) {
        return switch (a) {
            case "BASIC_ATTACK", "RAGE_STRIKE", "WHIRLWIND", "SHIELD_BASH", "PRECISE_SHOT", "BINDING_ARROW", "ARCANE_BOLT", "CHAIN_LIGHTNING", "MANA_DRAIN" -> true;
            default -> false;
        };
    }

    private boolean isAoe(String a) {
        return switch (a) {
            case "WHIRLWIND", "GUARDIAN_AURA", "CHAIN_LIGHTNING" -> true;
            default -> false;
        };
    }

    private int enemyTeam(int team) {
        return team == 1 ? 2 : 1;
    }

    private MatchState deepCopyState(MatchState original) {
        List<PlayerState> playersCopy = original.getPlayers().stream()
                .map(p -> {
                    // FIX: Filter out Ghost Effects from the Cache during Deep Copy
                    List<ActiveEffect> effectsCopy = p.getEffects() == null ? new ArrayList<>()
                            : new ArrayList<>(p.getEffects().stream()
                            .filter(e -> e.getEffectType() != null)
                            .map(e -> ActiveEffect.builder().effectType(e.getEffectType())
                                    .magnitude(e.getMagnitude()).turnsRemaining(e.getTurnsRemaining()).build())
                            .toList());
                    return PlayerState.builder()
                            .matchPlayerId(p.getMatchPlayerId()).playerId(p.getPlayerId())
                            .username(p.getUsername()).team(p.getTeam()).turnOrder(p.getTurnOrder())
                            .characterClass(p.getCharacterClass()).hp(p.getHp()).maxHp(p.getMaxHp())
                            .mana(p.getMana()).maxMana(p.getMaxMana()).alive(p.isAlive()).effects(effectsCopy)
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
                                .characterClass(p.getCharacterClass() != null ? p.getCharacterClass() : "BARBARIAN")
                                // FIX: Scrub Nulls from Active Effects Array to prevent Enum crash
                                .activeEffects(p.getEffects() == null ? List.of()
                                        : p.getEffects().stream()
                                        .map(ActiveEffect::getEffectType)
                                        .filter(type -> type != null)
                                        .toList())
                                .kills(p.getKills())
                                .damageDealt(p.getDamageDealt())
                                .healingDone(p.getHealingDone())
                                .build())
                        .toList())
                .nextTurnOrder(state.getCurrentTurnOrder()).turnNumber(state.getTurnNumber())
                .status(state.getStatus() != null ? state.getStatus() : "IN_PROGRESS")
                .winnerTeam(state.getWinnerTeam())
                .build();
    }
}