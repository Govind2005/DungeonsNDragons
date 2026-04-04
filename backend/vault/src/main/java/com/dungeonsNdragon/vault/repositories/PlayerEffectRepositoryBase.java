package com.dungeonsNdragon.vault.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.dungeonsNdragon.vault.entities.PlayerEffect;

@Repository
public interface PlayerEffectRepositoryBase extends JpaRepository<PlayerEffect, UUID> {
    List<PlayerEffect> findByMatchPlayerId(UUID matchPlayerId);

    @Modifying
    @Query("DELETE FROM PlayerEffect pe WHERE pe.matchPlayer.id = :mpId AND pe.effectType = :type")
    void deleteByMatchPlayerIdAndType(@Param("mpId") UUID mpId,
            @Param("type") PlayerEffect.EffectType type);

    @Modifying
    @Query("UPDATE PlayerEffect pe SET pe.turnsRemaining = pe.turnsRemaining - 1 " +
            "WHERE pe.matchPlayer.match.id = :matchId")
    void decrementAllTurnsForMatch(@Param("matchId") UUID matchId);

    @Modifying
    @Query("DELETE FROM PlayerEffect pe WHERE pe.matchPlayer.match.id = :matchId " +
            "AND pe.turnsRemaining <= 0")
    void deleteExpiredEffectsForMatch(@Param("matchId") UUID matchId);
}
