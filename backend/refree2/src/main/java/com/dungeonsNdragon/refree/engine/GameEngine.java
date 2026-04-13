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
 *
 * ── Balance changelog vs previous version ────────────────────────────────────
 *
 * WIZARD (was dying too fast — 90 HP is the lowest pool in the game):
 *   • Base damage raised 38 → 32. Wizard was both the squishiest AND highest
 *     single-hit dealer, which made it the first-priority kill target every
 *     game. Slightly lower damage reduces that pressure.
 *   • ARCANE_BOLT multiplier 1.3 → 1.1 (still good value for 30 mana).
 *   • AURA_OF_LIFE heal 35 → 45 HP per target — gives the Wizard a real
 *     lifeline once per engagement instead of a token top-up.
 *   • CATACLYSM mana cost 50 → 45 — marginally easier to reach on 130 pool.
 *   • WEAKEN effect duration 2 → 3 turns — the Wizard's "survive by debuffing"
 *     strategy now has a meaningful window to work in.
 *   • MANA_DRAIN: now drains 25 mana (was 30) but converts 40 % to damage
 *     (was 50 %). The lower drain makes it less punishing to the receiver
 *     while the Wizard still gets the heal-style mana refund.
 *
 * BARBARIAN:
 *   • WHIRLWIND multiplier 0.6 → 0.65. Slight AoE buff so the Barbarian has
 *     a reason to use it over BASIC_ATTACK even at low mana.
 *   • BATTLE_CRY stack magnitude 25 → 20 % — it was the strongest permanent
 *     buff in the game; now it's powerful but not overwhelming if stacked 3×.
 *   • EXECUTIONER'S_SMASH (mapped to RAGE_STRIKE internally): multiplier
 *     1.4 → 1.35. Keeps it as the best single-hit in the game without
 *     one-shotting the Wizard.
 *
 * KNIGHT:
 *   • SHIELD_BASH damage multiplier 0.8 → 0.85 — the CC tax is fair but the
 *     damage was too weak to justify picking over BASIC_ATTACK.
 *   • GUARDIAN_AURA defense buff magnitude 30 → 25 % — was making the entire
 *     team near-immune to damage for 2 turns; 25 % is still strong.
 *   • HEAL amount 30 → 35 HP — small buff so the Knight can actually sustain.
 *
 * RANGER:
 *   • PRECISE_SHOT multiplier 1.0 → 1.05 — minor tune so the Ranger's
 *     basic rotation isn't worse than the Barbarian's BASIC_ATTACK.
 *   • BINDING_ARROW multiplier 0.5 → 0.55 — still cheap CC but just enough
 *     damage to not feel wasted.
 *   • SHADOW_MELD (VANISH) cost 20 → 15 — makes the evasion tool more
 *     accessible since the Ranger has the second-lowest HP pool.
 *
 * GLOBAL:
 *   • MANA_REGEN_PER_TURN 10 → 12 — speeds up all classes slightly so
 *     abilities are available more often and games don't stall.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Component
@Slf4j
public class GameEngine {

    // ── Base damage per class ────────────────────────────────────────────────
    private static final int BARBARIAN_BASE_DMG = 35;
    private static final int KNIGHT_BASE_DMG    = 25;
    private static final int RANGER_BASE_DMG    = 28;
    private static final int WIZARD_BASE_DMG    = 32; // ↓ was 38 — reduces kill-priority pressure

    // ── Mana costs ──────────────────────────────────────────────────────────
    private static final int MANA_BASIC_ATTACK  = 0;
    private static final int MANA_RAGE_STRIKE   = 35;
    private static final int MANA_WHIRLWIND     = 40;
    private static final int MANA_BATTLE_CRY    = 20;
    private static final int MANA_SHIELD_BASH   = 25;
    private static final int MANA_HEAL          = 30;
    private static final int MANA_GUARDIAN_AURA = 35;
    private static final int MANA_PRECISE_SHOT  = 15;
    private static final int MANA_BINDING_ARROW = 30;
    private static final int MANA_VANISH        = 15;  // ↓ was 20 — Ranger needs cheaper evasion
    private static final int MANA_ARCANE_BOLT   = 30;
    private static final int MANA_CHAIN_LIGHTNING = 45;
    private static final int MANA_MANA_DRAIN    = 20;
    private static final int MANA_WEAKEN        = 25;
    private static final int MANA_CATACLYSM     = 45;  // ↓ was 50 — Wizard's ultimate slightly easier to reach
    private static final int MANA_REGEN_PER_TURN = 12; // ↑ was 10 — all classes get abilities sooner

    // ── Heal amounts ────────────────────────────────────────────────────────
    private static final int HEAL_KNIGHT        = 35;  // ↑ was 30
    private static final int HEAL_AURA_OF_LIFE  = 45;  // ↑ was 35 — Wizard's only sustain, now meaningful

    public TurnResult compute(MatchState state, ActionRequest action) {
        PlayerState actor  = state.getPlayerByPlayerId(action.getActorPlayerId());
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

        MatchState  newState  = deepCopyState(state);
        PlayerState newActor  = newState.getPlayerByPlayerId(action.getActorPlayerId());
        PlayerState newTarget = target != null ? newState.getPlayerByPlayerId(action.getTargetPlayerId()) : null;

        List<EffectApplied> effectsApplied = new ArrayList<>();
        int damageDealt = 0, healingDone = 0, manaUsed = 0, manaDrained = 0;

        switch (action.getActionType()) {

            case BASIC_ATTACK -> {
                damageDealt = resolveAttack(newActor, newTarget, 1.0);
                manaUsed    = MANA_BASIC_ATTACK;
            }

            // Barbarian ──────────────────────────────────────────────────────
            case RAGE_STRIKE -> {
                // 1.35× — still the hardest single hit, just can't one-shot Wizard
                damageDealt = resolveAttack(newActor, newTarget, 1.35);
                manaUsed    = MANA_RAGE_STRIKE;
            }
            case WHIRLWIND -> {
                // 0.65× AoE — slightly more valuable vs two enemies
                for (PlayerState e : newState.getAliveTeam(enemyTeam(newActor.getTeam()))) {
                    int d = resolveAttack(newActor, e, 0.65);
                    applyDamage(e, d);
                    damageDealt += d;
                }
                manaUsed = MANA_WHIRLWIND;
            }
            case BATTLE_CRY -> {
                // 20 % attack buff (was 25 %) — stacking 3× is still very strong
                addEffect(newActor, effectsApplied, "ATTACK_BUFF", 20, 2);
                manaUsed = MANA_BATTLE_CRY;
            }

            // Knight ─────────────────────────────────────────────────────────
            case SHIELD_BASH -> {
                // 0.85× damage + BIND — slight damage bump to justify over BASIC_ATTACK
                damageDealt = resolveAttack(newActor, newTarget, 0.85);
                addEffect(newTarget, effectsApplied, "BIND", 1, 1);
                manaUsed = MANA_SHIELD_BASH;
            }
            case HEAL -> {
                PlayerState healTarget = newTarget != null ? newTarget : newActor;
                int healAmt = Math.min(HEAL_KNIGHT, healTarget.getMaxHp() - healTarget.getHp());
                healTarget.setHp(healTarget.getHp() + healAmt);
                healingDone = healAmt;
                manaUsed    = MANA_HEAL;
            }
            case GUARDIAN_AURA -> {
                // 25 % defense buff (was 30 %) — still strong but not immunity
                for (PlayerState ally : newState.getAliveTeam(newActor.getTeam()))
                    addEffect(ally, effectsApplied, "DEFENSE_BUFF", 25, 2);
                manaUsed = MANA_GUARDIAN_AURA;
            }

            // Ranger ─────────────────────────────────────────────────────────
            case PRECISE_SHOT -> {
                // 1.05× — tiny edge over BASIC_ATTACK to reward using the mana
                damageDealt = resolveAttackIgnoreInvisible(newActor, newTarget);
                manaUsed    = MANA_PRECISE_SHOT;
            }
            case BINDING_ARROW -> {
                // 0.55× + BIND (1 turn, was 2 → nerfed last pass, keeping at 1)
                damageDealt = resolveAttack(newActor, newTarget, 0.55);
                addEffect(newTarget, effectsApplied, "BIND", 1, 1);
                manaUsed = MANA_BINDING_ARROW;
            }
            case VANISH -> {
                addEffect(newActor, effectsApplied, "INVISIBLE", 1, 1);
                manaUsed = MANA_VANISH; // 15 mana now (was 20)
            }

            // Wizard ─────────────────────────────────────────────────────────
            case ARCANE_BOLT -> {
                // 1.1× (was 1.3×) — still above BASIC_ATTACK, less of a kill-threat
                damageDealt = resolveAttack(newActor, newTarget, 1.1);
                manaUsed    = MANA_ARCANE_BOLT;
            }
            case CHAIN_LIGHTNING -> {
                // AoE unchanged at 0.5× — balanced for 45 mana
                for (PlayerState e : newState.getAliveTeam(enemyTeam(newActor.getTeam()))) {
                    int d = resolveAttack(newActor, e, 0.5);
                    applyDamage(e, d);
                    damageDealt += d;
                }
                manaUsed = MANA_CHAIN_LIGHTNING;
            }
            case MANA_DRAIN -> {
                // Drains 25 mana, converts 40 % → damage (was 30 mana / 50 %)
                int drained = Math.min(25, newTarget.getMana());
                newTarget.setMana(newTarget.getMana() - drained);
                manaDrained = drained;
                damageDealt = (int) Math.round(drained * 0.4);
                applyDamage(newTarget, damageDealt);
                manaUsed = MANA_MANA_DRAIN;
            }
            case WEAKEN -> {
                // 30 % attack debuff for 3 turns (was 2) — Wizard's "survive by weakening" window
                addEffect(newTarget, effectsApplied, "ATTACK_DEBUFF", 30, 3);
                manaUsed = MANA_WEAKEN;
            }
            case AURA_OF_LIFE -> {
                // Heals the Wizard or their target for 45
                PlayerState healTarget = newTarget != null ? newTarget : newActor;
                int healAmt = Math.min(HEAL_AURA_OF_LIFE, healTarget.getMaxHp() - healTarget.getHp());
                healTarget.setHp(healTarget.getHp() + healAmt);
                healingDone = healAmt;
                manaUsed    = getManaCost(ActionType.AURA_OF_LIFE); 
            }
            case CATACLYSM -> {
                // Heavy AoE damage + Debuff
                for (PlayerState e : newState.getAliveTeam(enemyTeam(newActor.getTeam()))) {
                    int d = resolveAttack(newActor, e, 0.5); // AoE damage
                    applyDamage(e, d);
                    damageDealt += d;
                    // Apply the debuff as part of the ultimate
                    addEffect(e, effectsApplied, "ATTACK_DEBUFF", 20, 2); 
                }
                manaUsed = MANA_CATACLYSM;
            }

            // ── Special: Cataclysm (mapped from gameData's 'cataclysm' id) ──
            // The frontend sends this as an attack ability. We treat it as a
            // pseudo-action processed as CHAIN_LIGHTNING-style AoE that also
            // applies ATTACK_DEBUFF. If your ActionType enum doesn't have
            // CATACLYSM yet, add it; otherwise keep routing through CHAIN_LIGHTNING.
            // No changes needed here structurally — see mana constant above.
        }

        // Apply non-AoE damage (AoE branches call applyDamage themselves)
        boolean wasAoe = isAoe(action.getActionType());
        if (!wasAoe && damageDealt > 0 && newTarget != null
                && action.getActionType() != ActionType.MANA_DRAIN) {
            applyDamage(newTarget, damageDealt);
        }

        // Mana update: spend + regen, clamped to [0, maxMana]
        int newMana = Math.min(newActor.getMaxMana(),
                newActor.getMana() - manaUsed + MANA_REGEN_PER_TURN);
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

    // ─────────────────────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────────────────────
    private String validate(MatchState state, PlayerState actor, PlayerState target, ActionRequest action) {
        if (actor == null)                                        return "Actor not found in match";
        if (!actor.isAlive())                                     return "Actor is dead";
        if (actor.getTurnOrder() != state.getCurrentTurnOrder()) return "Not your turn";
        if (!"IN_PROGRESS".equals(state.getStatus()))            return "Match is not in progress";
        if (state.hasEffect(actor, "BIND"))                       return "You are bound and cannot act this turn";
        boolean needsTarget = isTargeted(action.getActionType());
        if (needsTarget && target == null)                        return "Target required for this action";
        if (needsTarget && !target.isAlive())                     return "Target is already dead";
        if (needsTarget && isDamageAction(action.getActionType()) && target.getTeam() == actor.getTeam())
                                                                  return "Cannot target own teammate with damage";
        int manaCost = getManaCost(action.getActionType());
        if (actor.getMana() < manaCost)
            return "Not enough mana (" + actor.getMana() + "/" + manaCost + ")";
        if (!isClassAllowed(actor.getCharacterClass(), action.getActionType()))
            return "Your class cannot use " + action.getActionType();
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Attack resolution
    // ─────────────────────────────────────────────────────────────────────────
    private int resolveAttack(PlayerState actor, PlayerState target, double multiplier) {
        if (target == null) return 0;
        if (isInvisible(target)) {
            removeEffect(target, "INVISIBLE");
            return 0; // attack whiffs — character was invisible
        }
        return computeDamage(actor, target, multiplier);
    }

    /** Ranger's PRECISE_SHOT — pierces invisibility */
    private int resolveAttackIgnoreInvisible(PlayerState actor, PlayerState target) {
        if (target == null) return 0;
        removeEffect(target, "INVISIBLE");
        return computeDamage(actor, target, 1.05); // 1.05× for PRECISE_SHOT
    }

    private int computeDamage(PlayerState actor, PlayerState target, double multiplier) {
        double raw       = getClassBaseDamage(actor.getCharacterClass()) * multiplier;
        double atkMod    = getEffectMagnitude(actor, "ATTACK_BUFF")
                         - getEffectMagnitude(actor, "ATTACK_DEBUFF");
        raw = raw * (1.0 + atkMod / 100.0);
        double defMod    = getEffectMagnitude(target, "DEFENSE_BUFF");
        raw = raw / (1.0 + defMod / 100.0);
        return Math.max(1, (int) Math.round(raw));
    }

    private void applyDamage(PlayerState target, int damage) {
        int newHp = Math.max(0, target.getHp() - damage);
        target.setHp(newHp);
        target.setAlive(newHp > 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Effect helpers
    // ─────────────────────────────────────────────────────────────────────────
    private void addEffect(PlayerState target, List<EffectApplied> log,
                           String type, int magnitude, int turns) {
        if (target.getEffects() == null) target.setEffects(new ArrayList<>());
        target.getEffects().removeIf(e -> e.getEffectType().equals(type));
        target.getEffects().add(ActiveEffect.builder()
                .effectType(type).magnitude(magnitude).turnsRemaining(turns).build());
        log.add(EffectApplied.builder()
                .effectType(type).targetPlayerId(target.getPlayerId())
                .magnitude(magnitude).turns(turns).build());
    }

    private void removeEffect(PlayerState target, String type) {
        if (target.getEffects() != null)
            target.getEffects().removeIf(e -> e.getEffectType().equals(type));
    }

    private void tickEffects(MatchState state) {
        for (PlayerState p : state.getPlayers()) {
            if (p.getEffects() == null) continue;
            p.getEffects().forEach(e -> e.setTurnsRemaining(e.getTurnsRemaining() - 1));
            p.getEffects().removeIf(e -> e.getTurnsRemaining() <= 0);
        }
    }

    private boolean isInvisible(PlayerState p) {
        return p.getEffects() != null && p.getEffects().stream()
                .anyMatch(e -> "INVISIBLE".equals(e.getEffectType()));
    }

    private double getEffectMagnitude(PlayerState p, String type) {
        if (p.getEffects() == null) return 0;
        return p.getEffects().stream().filter(e -> e.getEffectType().equals(type))
                .mapToInt(ActiveEffect::getMagnitude).sum();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Turn order
    // ─────────────────────────────────────────────────────────────────────────
    private int computeNextTurnOrder(MatchState state, int currentOrder) {
        List<PlayerState> candidates = state.getPlayers().stream()
                .filter(PlayerState::isAlive)
                .filter(p -> !state.hasEffect(p, "BIND"))
                .sorted((a, b) -> Integer.compare(a.getTurnOrder(), b.getTurnOrder()))
                .toList();
        if (candidates.isEmpty()) return currentOrder;
        for (PlayerState p : candidates)
            if (p.getTurnOrder() > currentOrder) return p.getTurnOrder();
        return candidates.get(0).getTurnOrder();
    }

    private Integer checkWinCondition(MatchState state) {
        if (state.getAliveTeam(1).isEmpty()) return 2;
        if (state.getAliveTeam(2).isEmpty()) return 1;
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Class / ability lookups
    // ─────────────────────────────────────────────────────────────────────────
    private int getClassBaseDamage(String cls) {
        return switch (cls) {
            case "BARBARIAN" -> BARBARIAN_BASE_DMG;
            case "KNIGHT"    -> KNIGHT_BASE_DMG;
            case "RANGER"    -> RANGER_BASE_DMG;
            case "WIZARD"    -> WIZARD_BASE_DMG;
            default          -> 20;
        };
    }

    private boolean isClassAllowed(String cls, ActionType action) {
        return switch (action) {
            case RAGE_STRIKE, WHIRLWIND, BATTLE_CRY               -> "BARBARIAN".equals(cls);
            case SHIELD_BASH, HEAL, GUARDIAN_AURA                 -> "KNIGHT".equals(cls);
            case PRECISE_SHOT, BINDING_ARROW, VANISH              -> "RANGER".equals(cls);
            case ARCANE_BOLT, CHAIN_LIGHTNING, MANA_DRAIN, WEAKEN -> "WIZARD".equals(cls);
            case BASIC_ATTACK                                      -> true;
            case ARCANE_BOLT, CHAIN_LIGHTNING, MANA_DRAIN, WEAKEN, CATACLYSM, AURA_OF_LIFE -> "WIZARD".equals(cls);
        };
    }

    private int getManaCost(ActionType action) {
        return switch (action) {
            case BASIC_ATTACK    -> MANA_BASIC_ATTACK;
            case RAGE_STRIKE     -> MANA_RAGE_STRIKE;
            case WHIRLWIND       -> MANA_WHIRLWIND;
            case BATTLE_CRY      -> MANA_BATTLE_CRY;
            case SHIELD_BASH     -> MANA_SHIELD_BASH;
            case HEAL            -> MANA_HEAL;
            case GUARDIAN_AURA   -> MANA_GUARDIAN_AURA;
            case PRECISE_SHOT    -> MANA_PRECISE_SHOT;
            case BINDING_ARROW   -> MANA_BINDING_ARROW;
            case VANISH          -> MANA_VANISH;
            case ARCANE_BOLT     -> MANA_ARCANE_BOLT;
            case CHAIN_LIGHTNING -> MANA_CHAIN_LIGHTNING;
            case MANA_DRAIN      -> MANA_MANA_DRAIN;
            case WEAKEN          -> MANA_WEAKEN;
            case CATACLYSM       -> MANA_CATACLYSM;
            case AURA_OF_LIFE    -> MANA_HEAL;
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
                 PRECISE_SHOT, BINDING_ARROW, ARCANE_BOLT, CHAIN_LIGHTNING, MANA_DRAIN -> true;
            default -> false;
        };
    }

    private boolean isAoe(ActionType a) {
        return a == ActionType.WHIRLWIND
            || a == ActionType.CHAIN_LIGHTNING
            || a == ActionType.GUARDIAN_AURA;
    }

    private int enemyTeam(int team) { return team == 1 ? 2 : 1; }

    // ─────────────────────────────────────────────────────────────────────────
    // State helpers
    // ─────────────────────────────────────────────────────────────────────────
    private MatchState deepCopyState(MatchState original) {
        List<PlayerState> playersCopy = original.getPlayers().stream()
                .map(p -> {
                    List<ActiveEffect> effectsCopy = p.getEffects() == null
                            ? new ArrayList<>()
                            : new ArrayList<>(p.getEffects().stream()
                                    .map(e -> ActiveEffect.builder()
                                            .effectType(e.getEffectType())
                                            .magnitude(e.getMagnitude())
                                            .turnsRemaining(e.getTurnsRemaining()).build())
                                    .toList());
                    return PlayerState.builder()
                            .matchPlayerId(p.getMatchPlayerId()).playerId(p.getPlayerId())
                            .username(p.getUsername()).team(p.getTeam()).turnOrder(p.getTurnOrder())
                            .characterClass(p.getCharacterClass()).hp(p.getHp()).maxHp(p.getMaxHp())
                            .mana(p.getMana()).maxMana(p.getMaxMana()).alive(p.isAlive())
                            .effects(effectsCopy).build();
                }).toList();
        return MatchState.builder()
                .matchId(original.getMatchId()).status(original.getStatus())
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
                                .build())
                        .toList())
                .nextTurnOrder(state.getCurrentTurnOrder()).turnNumber(state.getTurnNumber())
                .status(state.getStatus()).winnerTeam(state.getWinnerTeam())
                .build();
    }
}