package com.dungeonsNdragon.vault.services;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dungeonsNdragon.vault.dto.PlayerDtos.CreatePlayerRequest;
import com.dungeonsNdragon.vault.dto.PlayerDtos.PlayerResponse;
import com.dungeonsNdragon.vault.dto.PlayerDtos.UpdateStatsRequest;
import com.dungeonsNdragon.vault.entities.Player;
import com.dungeonsNdragon.vault.repositories.PlayerRepositoryBase;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlayerService {
    private final PlayerRepositoryBase playerRepo;

    @Transactional
    public Player findOrCreatePlayer(CreatePlayerRequest req) {
        return playerRepo.findByGoogleId(req.getGoogleId())
                .orElseGet(() -> {
                    Player newPlayer = Player.builder()
                            .googleId(req.getGoogleId())
                            .username(req.getUsername())
                            .email(req.getEmail())
                            .wins(0).losses(0).xp(0)
                            .build();
                    log.info("Vault PlayerService: Creating new player: {}", req.getEmail());
                    return playerRepo.save(newPlayer);
                });
    }

    @Transactional(readOnly = true)
    public PlayerResponse getPlayer(UUID playerId) {
        Player p = playerRepo.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found: " + playerId));
        return toResponse(p);
    }

    @Transactional
    public void updatePostGameStats(UpdateStatsRequest req) {
        Player p = playerRepo.findById(req.getPlayerId())
                .orElseThrow(() -> new IllegalArgumentException("Player not found: " + req.getPlayerId()));
        if (req.isWon())
            p.setWins(p.getWins() + 1);
        else
            p.setLosses(p.getLosses() + 1);
        p.setXp(p.getXp() + req.getXpGained());
        playerRepo.save(p);
        log.debug("Vault PlayerService: Stats updated for player {} - wins: {}, losses: {}, xp: {}", p.getId(), p.getWins(), p.getLosses(), p.getXp());
    }

    private PlayerResponse toResponse(Player p) {
        int total = p.getWins() + p.getLosses();
        double winRate = total == 0 ? 0.0 : (double) p.getWins() / total * 100;
        return PlayerResponse.builder()
                .id(p.getId()).googleId(p.getGoogleId()).username(p.getUsername())
                .email(p.getEmail()).wins(p.getWins()).losses(p.getLosses()).xp(p.getXp())
                .winRate(Math.round(winRate * 100.0) / 100.0)
                .build();
    }
}
