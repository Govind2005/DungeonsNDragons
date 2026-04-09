package com.dungeonsNdragon.scribe.entities;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "leaderboard")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntry {
    @Id
    private UUID id;
    private String username;
    private int wins;
    private int losses;
    private int xp;

    @Column(name = "win_rate")
    private double winRate;
}
