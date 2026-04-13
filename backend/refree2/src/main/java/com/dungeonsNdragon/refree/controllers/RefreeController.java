package com.dungeonsNdragon.refree.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dungeonsNdragon.refree.dto.ActionRequest;
import com.dungeonsNdragon.refree.dto.TurnResult;
import com.dungeonsNdragon.refree.services.RefereeService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/referee")
@RequiredArgsConstructor
@Slf4j
class RefereeController {
private final RefereeService refereeService;

@PostMapping("/action")
public ResponseEntity<TurnResult> processAction(@RequestBody ActionRequest action) {
    log.info("Action received: {} by {} in match {}",
        action.getActionType(), action.getActorPlayerId(), action.getMatchId());
    return ResponseEntity.ok(refereeService.processAction(action));
}

@GetMapping("/health")
public ResponseEntity<String> health() {
    return ResponseEntity.ok("OK");
}
}
