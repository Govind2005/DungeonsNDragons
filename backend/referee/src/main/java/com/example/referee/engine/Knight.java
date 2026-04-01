package com.example.referee.engine;

import java.util.List;
import java.util.Map;

public class Knight implements CharacterClass {

    @Override
    public String getClassName() { return "Knight"; }

    @Override
    public void executeMove(String moveName, Map<String, Object> attacker, List<Map<String, Object>> targets, Map<String, Object> ally) {
        int currentMana = (int) attacker.get("mana");

        switch (moveName.toUpperCase()) {
            case "VALIANT_STRIKE": // Low Mana
                deductMana(attacker, 10);
                applyDamage(targets.get(0), 15);
                break;
            case "SHIELD_BASH": // Med Mana, adds shield status
                deductMana(attacker, 20);
                applyDamage(targets.get(0), 10);
                attacker.put("status", "SHIELDED");
                break;
            case "VANGUARDS_CHARGE": // High Mana, buffs ally and self
                deductMana(attacker, 35);
                applyDamage(targets.get(0), 25);
                attacker.put("buff", "ATTACK_UP");
                ally.put("buff", "ATTACK_UP");
                break;
            case "DIVINE_REST": // Med Mana, Self Heal
                deductMana(attacker, 20);
                int currentHp = (int) attacker.get("hp");
                attacker.put("hp", Math.min(150, currentHp + 40)); // Assuming 150 max HP
                break;
            case "GUARD_AND_GATHER":
                attacker.put("mana", Math.min(100, currentMana + 20));
                break;
            default:
                throw new IllegalArgumentException("Unknown Knight move: " + moveName);
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