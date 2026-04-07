package com.dungeonsNdragons.bouncer.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.dungeonsNdragons.bouncer.security.JwtService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/lobby")
@RequiredArgsConstructor
public class LobbyProxyController {

    private final RestTemplate restTemplate;
    private final JwtService jwtService;

    @Value("${services.lobby.url}")
    private String lobbyUrl;


    @PostMapping("/create")
    public ResponseEntity<Object> createRoom(@RequestHeader("Authorization") String authHeader) {
        // 1. Read the player's ID and Name from their JWT
        String token = jwtService.extractFromHeader(authHeader);
        String playerId = jwtService.extractPlayerId(token).toString();
        String username = jwtService.extractUsername(token);

        // 2. Package it up
        Map<String, String> request = Map.of("playerId", playerId, "username", username);

        // 3. Forward to the internal Lobby Manager
        return restTemplate.postForEntity(lobbyUrl + "/api/lobby/rooms/create", request, Object.class);
    }

    @PostMapping("/join/{roomCode}")
    public ResponseEntity<Object> joinRoom(
            @PathVariable String roomCode,
            // @RequestBody Map<String, String> payload,
            @RequestHeader("Authorization") String authHeader) {

        String token = jwtService.extractFromHeader(authHeader);
        Map<String, String> request = Map.of(
                "playerId", jwtService.extractPlayerId(token).toString(),
                "username", jwtService.extractUsername(token)
                // "characterClass", payload.get("characterClass") // React sends "WIZARD", etc.
        );

        return restTemplate.postForEntity(
                lobbyUrl + "/api/lobby/rooms/" + roomCode + "/join", request, Object.class);
    }

    @PostMapping("/rooms/quick-join")
    public ResponseEntity<Object> quickJoin(
            @RequestBody Map<String, String> payload,
            @RequestHeader("Authorization") String authHeader) {
        String token = jwtService.extractFromHeader(authHeader);
        Map<String, String> request = Map.of(
                "playerId", jwtService.extractPlayerId(token).toString(),
                "username", jwtService.extractUsername(token),
                "characterClass", payload.get("characterClass"));
        return restTemplate.postForEntity(lobbyUrl + "/api/lobby/rooms/quick-join", request, Object.class);
    }

    @PostMapping("/rooms/ready")
    public ResponseEntity<Object> playerReady(
            @RequestParam(name="roomCode") String roomCode,
            @RequestParam(name="characters") String characters,
            @RequestHeader("Authorization") String authHeader) {
        String token = jwtService.extractFromHeader(authHeader);
        String playerId = jwtService.extractPlayerId(token).toString();
        restTemplate.postForEntity(
                lobbyUrl + "/api/lobby/rooms/ready?roomCode=" + roomCode + "&playerId=" + playerId + "&characters=" + characters,
                null, Void.class);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/rooms/{roomCode}/leave")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable String roomCode,
            @RequestParam(name="playerId") String playerId) {
        restTemplate.delete(lobbyUrl + "/api/lobby/rooms/" + roomCode + "/leave?playerId=" + playerId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/rooms/{roomCode}")
    public ResponseEntity<Object> getRoom(@PathVariable String roomCode) {
        return restTemplate.getForEntity(lobbyUrl + "/api/lobby/rooms/" + roomCode, Object.class);
    }
}
