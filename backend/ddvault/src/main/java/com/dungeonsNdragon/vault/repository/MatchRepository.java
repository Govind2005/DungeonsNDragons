package com.dungeonsNdragon.vault.repository;


import com.dungeonsNdragon.vault.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MatchRepository extends JpaRepository<Match, String> {
}