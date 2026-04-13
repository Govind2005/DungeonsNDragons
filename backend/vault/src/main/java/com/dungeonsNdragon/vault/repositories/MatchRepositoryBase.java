package com.dungeonsNdragon.vault.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.dungeonsNdragon.vault.entities.Match;

@Repository
public interface MatchRepositoryBase extends JpaRepository<Match, UUID> {
    List<Match> findByStatus(Match.MatchStatus status);
}
