package com.dungeonsNdragon.vault.repositories;

import com.dungeonsNdragon.vault.entities.BattleLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BattleLogRepository extends JpaRepository<BattleLog, UUID> {
    List<BattleLog> findAllByOrderByTimestampDesc();
}