package com.dungeonsNdragon.vault.service;

import com.dungeonsNdragon.vault.dto.MatchDTO;
import com.dungeonsNdragon.vault.entity.Match;
import com.dungeonsNdragon.vault.repository.MatchRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class VaultService {

    @Autowired
    private MatchRepository matchRepository;

    public MatchDTO getMatch(String matchId) {
        log.info("Fetching match {} from database...", matchId);
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found: " + matchId));
        return convertToDTO(match);
    }

    @Transactional // Ensures the database save is safe and locks correctly
    public MatchDTO saveMatch(MatchDTO dto) {
        log.info("Saving updates for match {} to database...", dto.getMatchId());

        // Find existing match, or create a new one if it doesn't exist (from Lobby)
        Match match = matchRepository.findById(dto.getMatchId()).orElse(new Match());

        match.setMatchId(dto.getMatchId());
        match.setStatus(dto.getStatus());
        match.setCurrentTurn(dto.getCurrentTurn());
        match.setGameState(dto.getGameState());

        // We do NOT set the version manually. Hibernate handles @Version automatically!

        Match savedMatch = matchRepository.save(match);
        return convertToDTO(savedMatch);
    }

    // Helper method to translate Entity -> DTO
    private MatchDTO convertToDTO(Match entity) {
        MatchDTO dto = new MatchDTO();
        dto.setMatchId(entity.getMatchId());
        dto.setStatus(entity.getStatus());
        dto.setCurrentTurn(entity.getCurrentTurn());
        dto.setGameState(entity.getGameState());
        dto.setVersion(entity.getVersion());
        return dto;
    }
}