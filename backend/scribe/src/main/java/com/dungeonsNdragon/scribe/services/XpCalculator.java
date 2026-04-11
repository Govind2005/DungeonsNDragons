package com.dungeonsNdragon.scribe.services;


import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.dungeonsNdragon.scribe.dto.GameOverEvent;

/**
 * 
 * XP formula:
 * base = 100 (win) or 25 (loss)
 * kills = killsDealt × 15
 * speed = if won AND totalTurns < 20: (20 - totalTurns) × 5
 * 
 * Losers still earn kill XP — keeps losing from feeling completely unrewarding.
 */
@Component
@Slf4j
public class XpCalculator {
    private static final int FAST_WIN_THRESHOLD = 20;
    @Value("${xp.base-win:100}")
    private int baseWin;
    @Value("${xp.base-loss:25}")
    private int baseLoss;
    @Value("${xp.kill-bonus:15}")
    private int killBonus;
    @Value("${xp.turn-efficiency-bonus:5}")
    private int turnEfficiencyBonus;

    public int calculate(GameOverEvent.PlayerResult player, int totalTurns) {
        boolean isWinner = Boolean.TRUE.equals(player.getWon());
        int xp = isWinner ? baseWin : baseLoss;

        int kills = player.getKillsDealt() != null ? player.getKillsDealt() : 0;
        xp += kills * killBonus;

        if (isWinner && totalTurns < FAST_WIN_THRESHOLD) {
            xp += (FAST_WIN_THRESHOLD - totalTurns) * turnEfficiencyBonus;
        }
        return xp;
    }
}
