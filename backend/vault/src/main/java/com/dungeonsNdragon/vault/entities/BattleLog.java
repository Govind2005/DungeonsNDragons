package com.dungeonsNdragon.vault.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "battle_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BattleLog {
    @Id
    private UUID matchId;
    private String winnerTeam;
    private String player1;
    private String player2;
    private String player3;
    private String player4;
    private Instant timestamp;
}