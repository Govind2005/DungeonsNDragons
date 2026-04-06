package com.dungeonsNdragons.lobbyManager.services;

import java.io.Serializable;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Room implements Serializable {
    private String roomCode;
    private RoomStatus status;
    private String matchId;
    private List<RoomPlayer> players;
    private int playersReady;

    public enum RoomStatus {
        WAITING, STARTING, IN_GAME, FINISHED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomPlayer {
        private String playerId;
        private String username;
        private String characterClass;
        private int team;
        private int turnOrder;
    }
}
