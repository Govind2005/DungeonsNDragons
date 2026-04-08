package com.dungeonsNdragons.lobbyManager.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.dungeonsNdragons.lobbyManager.services.LobbyService;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/lobby")
@RequiredArgsConstructor
@Slf4j
class LobbyController {
    private final LobbyService lobbyService;

    @PostMapping("/rooms/create")
    public ResponseEntity<Object> createRoom(@RequestBody CreateRoomRequest req) {
        return ResponseEntity.ok(lobbyService.createRoom(req.getPlayerId(), req.getUsername()));
    }

    @PostMapping("/rooms/{roomCode}/select-character")
    public ResponseEntity<Object> selectCharacter(@PathVariable String roomCode,
            @RequestParam(name="playerId") String playerId, 
            @RequestParam(name="characterClass") String characterClass) {
        lobbyService.selectCharacter(roomCode, playerId, characterClass);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/rooms/ready")
    public ResponseEntity<Object> playerReady(@RequestParam(name="roomCode") String roomCode, @RequestParam(name="playerId") String playerId) {
        lobbyService.playerReady(roomCode, playerId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/rooms/{roomCode}/join")
    public ResponseEntity<Object> joinRoom(@PathVariable String roomCode,
            @RequestBody JoinRoomRequest req) {
        return ResponseEntity.ok(lobbyService.joinRoom(
                roomCode, req.getPlayerId(), req.getUsername(), req.getCharacterClass() != null ? req.getCharacterClass() : "BARBARIAN"));
    }

    @PostMapping("/rooms/quick-join")
    public ResponseEntity<Object> quickJoin(@RequestBody JoinRoomRequest req) {
        return ResponseEntity.ok(lobbyService.quickJoin(
                req.getPlayerId(), req.getUsername(), "BARBARIAN"));
    }

    @GetMapping("/rooms/{roomCode}")
    public ResponseEntity<Object> getRoom(@PathVariable String roomCode) {
        Object room = lobbyService.getRoom(roomCode);
        if (room == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(room);
    }

    @DeleteMapping("/rooms/{roomCode}/leave")
    public ResponseEntity<Void> leaveRoom(@PathVariable String roomCode,
            @RequestParam(name="playerId") String playerId) {
        lobbyService.leaveRoom(roomCode, playerId);
        return ResponseEntity.ok().build();
    }

    @Data
    static class CreateRoomRequest {
        private String playerId;
        private String username;
    }

    @Data
    static class JoinRoomRequest {
        private String playerId;
        private String username;
        private String characterClass;
    }
}
