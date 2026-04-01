package com.example.referee.engine;

import java.util.List;
import java.util.Map;

public class Ranger implements CharacterClass {

    @Override
    public String getClassName() { return "Ranger"; }

    @Override
    public void executeMove(String moveName, Map<String, Object> attacker, List<Map<String, Object>> targets, Map<String, Object> ally) {
        int currentMana = (int) attacker.get("mana");

        switch (moveName.toUpperCase()) {
            case "PRECISE_SHOT":
                deductMana(attacker, 10);
                applyDamage(targets.get(0), 18);
                break;
            case "PINNING_ARROW":
                deductMana(attacker, 20);
                applyDamage(targets.get(0), 8);
                targets.get(0).put("status", "BOUND"); // Frontend will read this to skip their turn!
                break;
            case "HAIL_OF_ARROWS":
                deductMana(attacker, 35);
                for (Map<String, Object> target : targets) {
                    applyDamage(target, 15);
                }
                break;
            case "SHADOW_MELD":
                deductMana(attacker, 20);
                attacker.put("status", "INVISIBLE"); // Attackers will miss next turn
                break;
            case "GUARD_AND_GATHER":
                attacker.put("mana", Math.min(100, currentMana + 20));
                break;
            default:
                throw new IllegalArgumentException("Unknown Ranger move: " + moveName);
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