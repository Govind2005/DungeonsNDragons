package com.example.scribe.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlayerDTO {
    private String playerId;
    private String username;
    private int wins;
    private int losses;
    private int totalGames;
}