package com.example.referee.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class ActionRequest {
    private String attackerId;       // e.g., "P1"
    private List<String> targetIds;  // e.g., ["P2", "P4"] for AoE, or just ["P2"] for single
    private String moveName;         // e.g., "WHIRLWIND" or "SAVAGE_STRIKE"
}