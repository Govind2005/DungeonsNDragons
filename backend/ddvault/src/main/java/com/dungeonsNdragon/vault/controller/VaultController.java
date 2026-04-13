package com.dungeonsNdragon.vault.controller;

import com.dungeonsNdragon.vault.dto.MatchDTO;
import com.dungeonsNdragon.vault.service.VaultService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/vault/matches")
public class VaultController {

    @Autowired
    private VaultService vaultService;

    @GetMapping("/{id}")
    public MatchDTO getMatch(@PathVariable String id) {
        return vaultService.getMatch(id);
    }

    @PostMapping("/save")
    public MatchDTO saveMatch(@RequestBody MatchDTO matchDTO) {
        return vaultService.saveMatch(matchDTO);
    }
}