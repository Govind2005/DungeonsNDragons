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

    @PostMapping("/game-over")
    public ResponseEntity<Map<String, String>> handleGameOver(@RequestBody GameOverEvent event) {
        log.info("ScribeController: Game over event received for match {}", event.getMatchId());
        scribeService.processGameOver(event);
        return ResponseEntity.accepted().body(Map.of("status", "processing"));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("ScribeController: Fetching battle logs (leaderboard proxy) page {} size {}", page, size);
        // LEADERBOARD FETCH COMMENTED OUT
        // return ResponseEntity.ok(scribeService.getLeaderboard(page, size));

        // Fetch logs from Vault and return them
        List<Map<String, Object>> logs = scribeService.getBattleLogsFromVault();
        log.debug("ScribeController: Successfully retrieved {} battle logs", logs.size());
        return ResponseEntity.ok(logs);
    }
}