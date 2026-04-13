package com.dungeonsNdragon.vault.controllers;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dungeonsNdragon.vault.dto.PlayerDtos.CreatePlayerRequest;
import com.dungeonsNdragon.vault.dto.PlayerDtos.PlayerResponse;
import com.dungeonsNdragon.vault.dto.PlayerDtos.UpdateStatsRequest;
import com.dungeonsNdragon.vault.entities.Player;
import com.dungeonsNdragon.vault.services.PlayerService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vault/players")
@RequiredArgsConstructor
class PlayerController {
    private final PlayerService playerService;

    @PostMapping("/upsert")
    public ResponseEntity<PlayerResponse> upsert(@RequestBody CreatePlayerRequest req) {
        Player p = playerService.findOrCreatePlayer(req);
        return ResponseEntity.ok(playerService.getPlayer(p.getId()));
    }

    @GetMapping("/{playerId}")
    public ResponseEntity<PlayerResponse> get(@PathVariable UUID playerId) {
        return ResponseEntity.ok(playerService.getPlayer(playerId));
    }

    @PostMapping("/stats")
    public ResponseEntity<Void> updateStats(@RequestBody UpdateStatsRequest req) {
        playerService.updatePostGameStats(req);
        return ResponseEntity.ok().build();
    }
}