package com.dungeonsNdragon.refree.engine;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.dungeonsNdragon.refree.dto.ActionRequest;
import com.dungeonsNdragon.refree.dto.TurnResult;
import com.dungeonsNdragon.refree.dto.TurnResult.EffectApplied;
import com.dungeonsNdragon.refree.entities.MatchState;
import com.dungeonsNdragon.refree.entities.MatchState.ActiveEffect;
import com.dungeonsNdragon.refree.entities.MatchState.PlayerState;

import lombok.extern.slf4j.Slf4j;

/**
 * GameEngine — pure stateless computation. No I/O, no Spring dependencies.
 * Fully Updated to Flat-Damage / Flat-Defense Ruleset.
 */
@Component
@Slf4j
public class GameEngine {

    private static final int MANA_REGEN_PER_TURN = 10;

    public TurnResult compute(MatchState state, ActionRequest action) {
        PlayerState actor = state.getPlayerByPlayerId(action.getActorPlayerId());

        // Smart Targeting for Heals & Self-Buffs
        UUID effectiveTargetId = action.getTargetPlayerId();
        if (effectiveTargetId == null && !isTargeted(action.getActionType().name())) {
            effectiveTargetId = action.getActorPlayerId();
        }

        PlayerState target = effectiveTargetId != null
                ? state.getPlayerByPlayerId(effectiveTargetId)
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
        PlayerState newTarget = target != null ? newState.getPlayerByPlayerId(effectiveTargetId) : null;

        List<EffectApplied> effectsApplied = new ArrayList<>();
        int damageDealt = 0, healingDone = 0, manaUsed = 0, manaDrained = 0;

        String moveName = action.getActionType().name();

        switch (moveName) {
            // ================== UNIVERSAL ==================
            case "GUARD_AND_GATHER" -> {
                manaUsed = -15; // Negative mana used = mana gained
                addEffect(newActor, effectsApplied, "DEFENSE_BUFF", 20, 1);
            }

            // ================== BARBARIAN ==================
            case "SAVAGE_STRIKE" -> {
                manaUsed = 10;
                damageDealt = resolveAttack(newActor, newTarget, 18);
            }
            case "WHIRLWIND" -> {
                manaUsed = 25;
                for (PlayerState e : newState.getAliveTeam(enemyTeam(newActor.getTeam()))) {
                    int d = resolveAttack(newActor, e, 14);
                    applyDamage(newActor, e, d);
                    damageDealt += d;
                }
            }
            case "EXECUTIONERS_SMASH" -> {
                manaUsed = 45;
                damageDealt = resolveAttack(newActor, newTarget, 40);
            }
            case "WAR_CRY" -> {
                manaUsed = 20;
                stackEffect(newActor, effectsApplied, "ATTACK_BUFF", 3, 999);
                addEffect(newActor, effectsApplied, "DEFENSE_BUFF", 15, 1);
            }

            // ================== KNIGHT ==================
            case "VALIANT_STRIKE" -> {
                manaUsed = 10;
                damageDealt = resolveAttack(newActor, newTarget, 14);
            }
            case "SHIELD_BASH" -> {
                manaUsed = 20;
                damageDealt = resolveAttack(newActor, newTarget, 16);
                addEffect(newActor, effectsApplied, "DEFENSE_BUFF", 20, 1);
            }
            case "VANGUARDS_CHARGE" -> {
                manaUsed = 45;
                damageDealt = resolveAttack(newActor, newTarget, 26);
                for (PlayerState ally : newState.getAliveTeam(newActor.getTeam())) {
                    stackEffect(ally, effectsApplied, "ATTACK_BUFF", 2, 999);
                }
            }
            case "DIVINE_REST" -> {
                manaUsed = 25;
                int healAmt = Math.min(35, newActor.getMaxHp() - newActor.getHp());
                newActor.setHp(newActor.getHp() + healAmt);
                healingDone += healAmt;
            }

            // ================== RANGER ==================
            case "PRECISE_SHOT" -> {
                manaUsed = 10;
                damageDealt = resolveAttack(newActor, newTarget, 16);
            }
            case "PINNING_ARROW" -> {
                manaUsed = 25;
                damageDealt = resolveAttack(newActor, newTarget, 8);
                addEffect(newTarget, effectsApplied, "BIND", 1, 1);
            }
            case "HAIL_OF_ARROWS" -> {
                manaUsed = 40;
                for (PlayerState e : newState.getAliveTeam(enemyTeam(newActor.getTeam()))) {
                    int d = resolveAttack(newActor, e, 18);
                    applyDamage(newActor, e, d);
                    damageDealt += d;
                }
            }
            case "SHADOW_MELD" -> {
                manaUsed = 20;
                addEffect(newActor, effectsApplied, "SHADOW_MELD", 1, 999); // Removed on next hit
            }

            // ================== WIZARD ==================
            case "ARCANE_BURST" -> {
                manaUsed = 10;
                for (PlayerState e : newState.getAliveTeam(enemyTeam(newActor.getTeam()))) {
                    int d = resolveAttack(newActor, e, 12);
                    applyDamage(newActor, e, d);
                    damageDealt += d;
                }
            }
            case "MIND_SIPHON" -> {
                manaUsed = 25;
                for (PlayerState e : newState.getAliveTeam(enemyTeam(newActor.getTeam()))) {
                    int d = resolveAttack(newActor, e, 14);
                    applyDamage(newActor, e, d);
                    damageDealt += d;

                    int drained = Math.min(10, e.getMana());
                    e.setMana(Math.max(0, e.getMana() - drained));
                    manaDrained += drained;
                }
                // Wizard gains the drained mana
                manaUsed -= manaDrained;
            }
            case "CATACLYSM" -> {
                manaUsed = 50;
                for (PlayerState e : newState.getAliveTeam(enemyTeam(newActor.getTeam()))) {
                    int d = resolveAttack(newActor, e, 28);
                    applyDamage(newActor, e, d);
                    damageDealt += d;

                    // Reduce Max Stats
                    e.setMaxHp(Math.max(1, e.getMaxHp() - 10));
                    e.setHp(Math.min(e.getHp(), e.getMaxHp()));
                    e.setMaxMana(Math.max(1, e.getMaxMana() - 10));
                    e.setMana(Math.min(e.getMana(), e.getMaxMana()));
                    stackEffect(e, effectsApplied, "ATTACK_DEBUFF", 2, 999);
                }
            }
            case "AURA_OF_LIFE" -> {
                manaUsed = 30;
                for (PlayerState ally : newState.getAliveTeam(newActor.getTeam())) {
                    int healAmt = Math.min(25, ally.getMaxHp() - ally.getHp());
                    ally.setHp(ally.getHp() + healAmt);
                    healingDone += healAmt;
                }
            }

            default -> {
                damageDealt = 0;
                manaUsed = 0;
            }
        }

        boolean wasAoe = isAoe(moveName);
        if (!wasAoe && damageDealt > 0 && newTarget != null) {
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
                .targetPlayerId(effectiveTargetId).damageDealt(damageDealt)
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

    // THE NEW FLAT MATH SYSTEM
    private int resolveAttack(PlayerState actor, PlayerState target, int baseMoveDamage) {
        if (target == null) return 0;

        // Handle Ranger's Shadow Meld Immunity
        if (hasEffect(target, "SHADOW_MELD")) {
            removeEffect(target, "SHADOW_MELD");
            return 0;
        }

        int attackMod = getEffectMagnitude(actor, "ATTACK_BUFF") - getEffectMagnitude(actor, "ATTACK_DEBUFF");
        int totalAttack = baseMoveDamage + attackMod;

        int targetBaseDefense = getClassBaseDefense(target.getCharacterClass());
        int defenseMod = getEffectMagnitude(target, "DEFENSE_BUFF");
        int totalDefense = targetBaseDefense + defenseMod;

        int finalDamage = totalAttack - totalDefense;
        return Math.max(1, finalDamage); // Minimum 1 damage on a successful hit
    }

    private int getClassBaseDefense(String cls) {
        if (cls == null) return 0;
        return switch (cls.toUpperCase()) {
            case "BARBARIAN" -> 10;
            case "KNIGHT" -> 16;
            case "RANGER" -> 8;
            case "WIZARD" -> 7;
            default -> 0;
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

    // Standard temporary effects (overwrites previous)
    private void addEffect(PlayerState target, List<EffectApplied> log, String type, int magnitude, int turns) {
        if (target.getEffects() == null) target.setEffects(new ArrayList<>());
        target.getEffects().removeIf(e -> e.getEffectType() == null || e.getEffectType().equals(type));
        target.getEffects().add(ActiveEffect.builder()
                .effectType(type).magnitude(magnitude).turnsRemaining(turns).build());
        log.add(EffectApplied.builder()
                .effectType(type).targetPlayerId(target.getPlayerId()).magnitude(magnitude).turns(turns).build());
    }

    // Stacking permanent effects (adds magnitude together)
    private void stackEffect(PlayerState target, List<EffectApplied> log, String type, int magnitude, int turns) {
        if (target.getEffects() == null) target.setEffects(new ArrayList<>());

        int existingMag = 0;
        for (ActiveEffect e : target.getEffects()) {
            if (e.getEffectType() != null && e.getEffectType().equals(type)) {
                existingMag = e.getMagnitude();
            }
        }

        target.getEffects().removeIf(e -> e.getEffectType() == null || e.getEffectType().equals(type));
        int newMag = existingMag + magnitude;

        target.getEffects().add(ActiveEffect.builder()
                .effectType(type).magnitude(newMag).turnsRemaining(turns).build());
        log.add(EffectApplied.builder()
                .effectType(type).targetPlayerId(target.getPlayerId()).magnitude(magnitude).turns(turns).build());
    }

    private void removeEffect(PlayerState target, String type) {
        if (target.getEffects() != null)
            target.getEffects().removeIf(e -> e.getEffectType() != null && e.getEffectType().equals(type));
    }

    private boolean hasEffect(PlayerState target, String type) {
        if (target.getEffects() == null) return false;
        return target.getEffects().stream().anyMatch(e -> type.equals(e.getEffectType()));
    }

    private void tickPlayerEffects(PlayerState p) {
        if (p.getEffects() == null) return;
        p.getEffects().forEach(e -> e.setTurnsRemaining(e.getTurnsRemaining() - 1));
        p.getEffects().removeIf(e -> e.getTurnsRemaining() <= 0);
    }

    private int getEffectMagnitude(PlayerState p, String type) {
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
        if ("GUARD_AND_GATHER".equals(moveName)) return true;
        if (cls == null) return false;
        return switch (cls.toUpperCase()) {
            case "BARBARIAN" -> List.of("SAVAGE_STRIKE", "WHIRLWIND", "EXECUTIONERS_SMASH", "WAR_CRY").contains(moveName);
            case "KNIGHT" -> List.of("VALIANT_STRIKE", "SHIELD_BASH", "VANGUARDS_CHARGE", "DIVINE_REST").contains(moveName);
            case "RANGER" -> List.of("PRECISE_SHOT", "PINNING_ARROW", "HAIL_OF_ARROWS", "SHADOW_MELD").contains(moveName);
            case "WIZARD" -> List.of("ARCANE_BURST", "MIND_SIPHON", "CATACLYSM", "AURA_OF_LIFE").contains(moveName);
            default -> false;
        };
    }

    private int getManaCost(String moveName) {
        return switch (moveName) {
            case "GUARD_AND_GATHER" -> 0; // Gains mana, handled in logic
            case "SAVAGE_STRIKE", "VALIANT_STRIKE", "PRECISE_SHOT", "ARCANE_BURST" -> 10;
            case "SHIELD_BASH", "WAR_CRY", "SHADOW_MELD" -> 20;
            case "WHIRLWIND", "DIVINE_REST", "PINNING_ARROW", "MIND_SIPHON" -> 25;
            case "AURA_OF_LIFE" -> 30;
            case "HAIL_OF_ARROWS" -> 40;
            case "EXECUTIONERS_SMASH", "VANGUARDS_CHARGE" -> 45;
            case "CATACLYSM" -> 50;
            default -> 0;
        };
    }

    private boolean isTargeted(String a) {
        return switch (a) {
            case "GUARD_AND_GATHER", "WHIRLWIND", "WAR_CRY", "DIVINE_REST", "HAIL_OF_ARROWS", "SHADOW_MELD", "ARCANE_BURST", "MIND_SIPHON", "CATACLYSM", "AURA_OF_LIFE" -> false;
            default -> true;
        };
    }

    private boolean isDamageAction(String a) {
        return switch (a) {
            case "SAVAGE_STRIKE", "WHIRLWIND", "EXECUTIONERS_SMASH", "VALIANT_STRIKE", "SHIELD_BASH", "VANGUARDS_CHARGE", "PRECISE_SHOT", "PINNING_ARROW", "HAIL_OF_ARROWS", "ARCANE_BURST", "MIND_SIPHON", "CATACLYSM" -> true;
            default -> false;
        };
    }

    private boolean isAoe(String a) {
        return switch (a) {
            case "WHIRLWIND", "HAIL_OF_ARROWS", "ARCANE_BURST", "MIND_SIPHON", "CATACLYSM" -> true;
            default -> false;
        };
    }

    private int enemyTeam(int team) {
        return team == 1 ? 2 : 1;
    }

    private MatchState deepCopyState(MatchState original) {
        List<PlayerState> playersCopy = original.getPlayers().stream()
                .map(p -> {
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