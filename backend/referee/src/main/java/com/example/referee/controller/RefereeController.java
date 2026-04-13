package com.example.referee.controller;

import com.example.referee.dto.ActionRequest;
import com.example.referee.dto.MatchDTO;
import com.example.referee.service.CombatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/internal/referee")
public class RefereeController {

    @Autowired
    private CombatService combatService;

    @PostMapping("/calculate/{matchId}")
    public MatchDTO calculate(@PathVariable String matchId, @RequestBody ActionRequest request) {
        return combatService.calculateTurn(matchId, request);
    }
}