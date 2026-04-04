package com.dungeonsNdragon.vault.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.dungeonsNdragon.vault.entities.MatchPlayer;

@Repository
public interface MatchPlayerRepositoryBase extends JpaRepository<MatchPlayer, UUID> {
    List<MatchPlayer> findByMatchIdOrderByTurnOrder(UUID matchId);

    Optional<MatchPlayer> findByMatchIdAndPlayerId(UUID matchId, UUID playerId);

    @Query("SELECT mp FROM MatchPlayer mp WHERE mp.match.id = :matchId AND mp.team = :team")
    List<MatchPlayer> findByMatchIdAndTeam(@Param("matchId") UUID matchId, @Param("team") int team);

    @Query("SELECT mp FROM MatchPlayer mp WHERE mp.match.id = :matchId AND mp.alive = true")
    List<MatchPlayer> findAliveByMatchId(@Param("matchId") UUID matchId);

    @Modifying
    @Query("UPDATE MatchPlayer mp SET mp.hp = :hp, mp.mana = :mana, mp.alive = :alive WHERE mp.id = :id")
    void updateStats(@Param("id") UUID id, @Param("hp") int hp,
            @Param("mana") int mana, @Param("alive") boolean alive);
}
