package com.example.scribe.controller;

import com.example.scribe.dto.PlayerDTO;
import com.example.scribe.service.ScribeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/scribe")
public class ScribeController {

    @Autowired
    private ScribeService scribeService;

    // The Referee will send a POST here like: /internal/scribe/game-over/match-123?winner=Team A
    @PostMapping("/game-over/{matchId}")
    public ResponseEntity<String> reportGameOver(
            @PathVariable String matchId,
            @RequestParam String winner) {

        scribeService.processGameOver(matchId, winner);
        return ResponseEntity.ok("Match recorded successfully.");
    }

    @GetMapping("/players/{playerId}")
    public PlayerDTO getPlayer(@PathVariable String playerId) {
        return scribeService.getPlayerProfile(playerId);
    }
}