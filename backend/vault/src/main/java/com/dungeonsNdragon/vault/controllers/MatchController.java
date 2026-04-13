package com.dungeonsNdragon.vault.controllers;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dungeonsNdragon.vault.dto.MatchDtos.CreateMatchRequest;
import com.dungeonsNdragon.vault.dto.MatchDtos.MatchStateResponse;
import com.dungeonsNdragon.vault.dto.TurnDtos.ApplyTurnRequest;
import com.dungeonsNdragon.vault.entities.Match;
import com.dungeonsNdragon.vault.services.MatchService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vault/matches")
@RequiredArgsConstructor
class MatchController {
    private final MatchService matchService;

    @PostMapping
    public ResponseEntity<MatchStateResponse> createMatch(@RequestBody CreateMatchRequest req) {
        Match match = matchService.createMatch(req);
        return ResponseEntity.ok(matchService.getMatchState(match.getId()));
    }

    @PostMapping("/{matchId}/start")
    public ResponseEntity<MatchStateResponse> startMatch(@PathVariable UUID matchId) {
        matchService.startMatch(matchId);
        return ResponseEntity.ok(matchService.getMatchState(matchId));
    }

    @PostMapping("/turn")
    public ResponseEntity<MatchStateResponse> applyTurn(@RequestBody ApplyTurnRequest req) {
        return ResponseEntity.ok(matchService.applyTurnResult(req));
    }

    @GetMapping("/{matchId}/state")
    public ResponseEntity<MatchStateResponse> getState(@PathVariable UUID matchId) {
        return ResponseEntity.ok(matchService.getMatchState(matchId));
    }

    @PostMapping("/{matchId}/abandon")
    public ResponseEntity<Void> abandonMatch(@PathVariable UUID matchId) {
        matchService.abandonMatch(matchId);
        return ResponseEntity.ok().build();
    }
}
