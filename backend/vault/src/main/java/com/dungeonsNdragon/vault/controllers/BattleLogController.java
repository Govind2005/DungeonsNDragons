package com.dungeonsNdragon.vault.controllers;

import com.dungeonsNdragon.vault.entities.BattleLog;
import com.dungeonsNdragon.vault.repositories.BattleLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/vault/battle-logs")
@RequiredArgsConstructor
@Slf4j
public class BattleLogController {

    private final BattleLogRepository battleLogRepo;

    @PostMapping
    public ResponseEntity<Void> saveLog(@RequestBody BattleLog logEntry) {
        log.info("Vault: Saving battle log for match {}", logEntry.getMatchId());
        if (logEntry.getTimestamp() == null) {
            logEntry.setTimestamp(Instant.now());
        }
        battleLogRepo.save(logEntry);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<BattleLog>> getLogs() {
        log.debug("Vault: Fetching all battle logs");
        return ResponseEntity.ok(battleLogRepo.findAllByOrderByTimestampDesc());
    }
}