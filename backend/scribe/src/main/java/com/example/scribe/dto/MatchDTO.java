package com.example.scribe.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.Map;

@Getter
@Setter
public class MatchDTO {
    private String matchId;
    private Map<String, Object> gameState;
}