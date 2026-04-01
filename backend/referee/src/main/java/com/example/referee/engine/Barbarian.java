package com.example.referee.engine;

import java.util.List;
import java.util.Map;

public class Barbarian implements CharacterClass {

    @Override
    public String getClassName() { return "Barbarian"; }

    @Override
    public void executeMove(String moveName, Map<String, Object> attacker, List<Map<String, Object>> targets, Map<String, Object> ally) {
        int currentMana = (int) attacker.get("mana");

        // Check if the Barbarian has used War Cry before. Default to 0 if they haven't.
        int warCryStacks = attacker.containsKey("war_cry_stacks") ? (int) attacker.get("war_cry_stacks") : 0;

        // Let's say each stack of War Cry adds +10 permanent damage
        int bonusDamage = warCryStacks * 10;

        switch (moveName.toUpperCase()) {
            case "SAVAGE_STRIKE":
                deductMana(attacker, 10);
                applyDamage(targets.getFirst(), 20 + bonusDamage);
                break;

            case "WHIRLWIND":
                deductMana(attacker, 20);
                for (Map<String, Object> target : targets) {
                    applyDamage(target, 15 + bonusDamage);
                }
                break;

            case "EXECUTIONERS_SMASH":
                deductMana(attacker, 40);
                applyDamage(targets.get(0), 45 + bonusDamage);
                break;

            case "WAR_CRY": // <-- The Defense 2!
                deductMana(attacker, 20);
                // Add a stack to the database so The Vault remembers it for next turn
                attacker.put("war_cry_stacks", warCryStacks + 1);
                break;

            case "GUARD_AND_GATHER":
                attacker.put("mana", Math.min(100, currentMana + 20));
                break;

            default:
                throw new IllegalArgumentException("Unknown Barbarian move: " + moveName);
        }
    }

    private void deductMana(Map<String, Object> player, int cost) {
        int mana = (int) player.get("mana");
        if (mana < cost) throw new IllegalStateException("Not enough mana!");
        player.put("mana", mana - cost);
    }

    private void applyDamage(Map<String, Object> target, int damage) {
        int hp = (int) target.get("hp");
        target.put("hp", Math.max(0, hp - damage));
    }
}