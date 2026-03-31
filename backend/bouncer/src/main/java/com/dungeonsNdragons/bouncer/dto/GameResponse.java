package com.dungeonsNdragons.bouncer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameResponse {
    String roomId;
    String playerId;
    String actionType;
    String character;
    String targetId;
    String action;
    // fields related to the game state after the action is performed, such as health points, status effects, etc.
}
