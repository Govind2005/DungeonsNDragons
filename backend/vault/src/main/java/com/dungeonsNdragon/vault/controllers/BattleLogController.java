package com.dungeonsNdragon.vault.controllers;

import com.dungeonsNdragon.vault.entities.BattleLog;
import com.dungeonsNdragon.vault.repositories.BattleLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/vault/battle-logs")
@RequiredArgsConstructor
public class BattleLogController {

    private final BattleLogRepository battleLogRepo;

    @PostMapping
    public ResponseEntity<Void> saveLog(@RequestBody BattleLog log) {
        if (log.getTimestamp() == null) {
            log.setTimestamp(Instant.now());
        }
        battleLogRepo.save(log);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<BattleLog>> getLogs() {
        return ResponseEntity.ok(battleLogRepo.findAllByOrderByTimestampDesc());
    }
}