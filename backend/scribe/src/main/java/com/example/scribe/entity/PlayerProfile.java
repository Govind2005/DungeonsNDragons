package com.example.scribe.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "players")
@Getter
@Setter
public class PlayerProfile {

    @Id
    private String playerId;

    private String username;
    private int wins = 0;
    private int losses = 0;
    private int totalGames = 0;

    // Optional: Empty constructor for JPA
    public PlayerProfile() {}

    public PlayerProfile(String playerId) {
        this.playerId = playerId;
        this.username = "Player_" + playerId; // Default name
    }
}