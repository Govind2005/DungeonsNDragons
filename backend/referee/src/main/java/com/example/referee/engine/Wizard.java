package com.example.referee.engine;

import java.util.List;
import java.util.Map;

public class Wizard implements CharacterClass {

    @Override
    public String getClassName() { return "Wizard"; }

    @Override
    public void executeMove(String moveName, Map<String, Object> attacker, List<Map<String, Object>> targets, Map<String, Object> ally) {
        int currentMana = (int) attacker.get("mana");

        switch (moveName.toUpperCase()) {
            case "ARCANE_BURST":
                deductMana(attacker, 25);
                for (Map<String, Object> target : targets) applyDamage(target, 20);
                break;
            case "MIND_SIPHON":
                deductMana(attacker, 35);
                for (Map<String, Object> target : targets) {
                    applyDamage(target, 15);
                    int targetMana = (int) target.get("mana");
                    target.put("mana", Math.max(0, targetMana - 15)); // Burn target's mana
                }
                break;
            case "CATACLYSM":
                deductMana(attacker, 50);
                for (Map<String, Object> target : targets) {
                    applyDamage(target, 35);
                    target.put("status", "WEAKENED");
                }
                break;
            case "AURA_OF_LIFE":
                deductMana(attacker, 30);
                // Heal self and ally
                int myHp = (int) attacker.get("hp");
                int allyHp = (int) ally.get("hp");
                attacker.put("hp", Math.min(70, myHp + 30)); // Assuming 70 max HP for Wizard
                ally.put("hp", allyHp + 30); // You can put a dynamic max cap here later
                break;
            case "GUARD_AND_GATHER":
                attacker.put("mana", Math.min(100, currentMana + 20));
                break;
            default:
                throw new IllegalArgumentException("Unknown Wizard move: " + moveName);
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