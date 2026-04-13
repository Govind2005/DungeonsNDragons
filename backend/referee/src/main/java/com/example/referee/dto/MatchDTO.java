package com.example.referee.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.Map;

@Getter
@Setter
public class MatchDTO {
    private String matchId;
    private String status;       // "ACTIVE" or "FINISHED"
    private String currentTurn;  // "P1", "P2", "P3", or "P4"
    private Map<String, Object> gameState;
    private Integer version;
}