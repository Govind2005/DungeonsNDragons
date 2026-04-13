package com.dungeonsNdragon.scribe.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dungeonsNdragon.scribe.dto.GameOverEvent;
import com.dungeonsNdragon.scribe.services.ScribeService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/scribe")
@RequiredArgsConstructor
@Slf4j
class ScribeController {
    private final ScribeService scribeService;

    /**
     * Called by Referee when match ends.
     * Returns 202 immediately — all processing is @Async.
     */
    @PostMapping("/game-over")
    public ResponseEntity<Map<String, String>> handleGameOver(@RequestBody GameOverEvent event) {
        log.info("Game over event received for match {}", event.getMatchId());
        scribeService.processGameOver(event);
        return ResponseEntity.accepted().body(Map.of("status", "processing"));
    }

    /**
     * Public leaderboard — reads from Postgres materialized view.
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(scribeService.getLeaderboard(page, size));
    }
}
