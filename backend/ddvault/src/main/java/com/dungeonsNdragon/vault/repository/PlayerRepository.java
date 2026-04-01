package com.dungeonsNdragon.vault.repository;

import com.dungeonsNdragon.vault.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerRepository extends JpaRepository<Player, String> {
    // Just by naming the method this way, Spring writes the SQL to search by username!
    Player findByUsername(String username);
}
