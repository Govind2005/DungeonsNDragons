package com.dungeonsNdragon.vault.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.dungeonsNdragon.vault.entities.Player;

@Repository
public interface PlayerRepositoryBase extends JpaRepository<Player, UUID> {
    Optional<Player> findByGoogleId(String googleId);

    Optional<Player> findByEmail(String email);
}
