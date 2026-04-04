package com.dungeonsNdragon.vault.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.dungeonsNdragon.vault.entities.TurnLog;

@Repository
public interface TurnLogRepositoryBase extends JpaRepository<TurnLog, UUID> {
    List<TurnLog> findByMatchIdOrderByTurnNumber(UUID matchId);

    @Query("SELECT MAX(t.turnNumber) FROM TurnLog t WHERE t.matchId = :matchId")
    Optional<Integer> findMaxTurnNumber(@Param("matchId") UUID matchId);
}
