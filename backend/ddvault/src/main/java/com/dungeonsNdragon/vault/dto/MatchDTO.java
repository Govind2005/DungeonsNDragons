package com.dungeonsNdragon.vault.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.Map;

@Getter
@Setter
public class MatchDTO {
    private String matchId;
    private String status;
    private String currentTurn;
    private Map<String, Object> gameState;
    private Integer version;
}