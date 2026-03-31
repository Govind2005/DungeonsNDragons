package com.dungeonsNdragons.bouncer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GameAction {

    private String roomId;
    private String playerId;
    private String actionType;
    private String character;
    private String targetId;
    private String action;
}
