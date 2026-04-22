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

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/lobby")
@RequiredArgsConstructor
@Slf4j
public class LobbyProxyController {

    private final RestTemplate restTemplate;
    private final JwtService jwtService;

    @Value("${services.lobby.url}")
    private String lobbyUrl;


    @PostMapping("/create")
    public ResponseEntity<Object> createRoom(@RequestHeader("Authorization") String authHeader) {
        log.info("Received request to create lobby room");
        // 1. Read the player's ID and Name from their JWT
        String token = jwtService.extractFromHeader(authHeader);
        String playerId = jwtService.extractPlayerId(token).toString();
        String username = jwtService.extractUsername(token);

        // 2. Package it up
        Map<String, String> request = Map.of("playerId", playerId, "username", username);
        log.debug("Forwarding create proxy request to LobbyManager for player {} ({})", username, playerId);

        // 3. Forward to the internal Lobby Manager
        ResponseEntity<Object> response = restTemplate.postForEntity(lobbyUrl + "/api/lobby/rooms/create", request, Object.class);
        log.info("Successfully proxied create room request, internal status: {}", response.getStatusCode());
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @PostMapping("/join/{roomCode}")
    public ResponseEntity<Object> joinRoom(
            @PathVariable String roomCode,
            @RequestBody(required = false) Map<String, String> payload,
            @RequestHeader("Authorization") String authHeader) {
        log.info("Received request to join room {}", roomCode);

        String token = jwtService.extractFromHeader(authHeader);
        Map<String, String> request = new java.util.HashMap<>();
        String username = jwtService.extractUsername(token);
        request.put("playerId", jwtService.extractPlayerId(token).toString());
        request.put("username", username);
        if (payload != null && payload.get("characterClass") != null) {
            request.put("characterClass", payload.get("characterClass"));
        }

        log.debug("Forwarding join room proxy request for user {} to room {}", username, roomCode);
        ResponseEntity<Object> response = restTemplate.postForEntity(
                lobbyUrl + "/api/lobby/rooms/" + roomCode + "/join", request, Object.class);
        log.info("Successfully proxied join room {}, internal status: {}", roomCode, response.getStatusCode());
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @PostMapping("/rooms/quick-join")
    public ResponseEntity<Object> quickJoin(
            @RequestBody Map<String, String> payload,
            @RequestHeader("Authorization") String authHeader) {
        log.info("Received request for quick join");
        String token = jwtService.extractFromHeader(authHeader);
        Map<String, String> request = new java.util.HashMap<>();
        String username = jwtService.extractUsername(token);
        request.put("playerId", jwtService.extractPlayerId(token).toString());
        request.put("username", username);
        if (payload != null && payload.get("characterClass") != null) {
            request.put("characterClass", payload.get("characterClass"));
        }
        log.debug("Forwarding quick join proxy request for user {}", username);
        ResponseEntity<Object> response = restTemplate.postForEntity(lobbyUrl + "/api/lobby/rooms/quick-join", request, Object.class);
        log.info("Successfully proxied quick join, internal status: {}", response.getStatusCode());
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }

    @PostMapping("/rooms/{roomCode}/select-character")
    public ResponseEntity<Object> selectCharacter(
            @PathVariable String roomCode,
            @RequestParam(name="characterClass") String characterClass,
            @RequestHeader("Authorization") String authHeader) {
        log.info("Received character selection for room {}: {}", roomCode, characterClass);
        String token = jwtService.extractFromHeader(authHeader);
        String playerId = jwtService.extractPlayerId(token).toString();
        restTemplate.postForEntity(
                lobbyUrl + "/api/lobby/rooms/" + roomCode + "/select-character?playerId=" + playerId + "&characterClass=" + characterClass,
                null, Void.class);
        log.debug("Proxy select character successful for player {}", playerId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/rooms/ready")
    public ResponseEntity<Object> playerReady(
            @RequestParam(name="roomCode") String roomCode,
            @RequestHeader("Authorization") String authHeader) {
        log.info("Player ready in room {}", roomCode);
        String token = jwtService.extractFromHeader(authHeader);
        String playerId = jwtService.extractPlayerId(token).toString();
        restTemplate.postForEntity(
                lobbyUrl + "/api/lobby/rooms/ready?roomCode=" + roomCode + "&playerId=" + playerId,
                null, Void.class);
        log.debug("Proxy player ready successful for player {}", playerId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/rooms/{roomCode}/leave")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable String roomCode,
            @RequestParam(name="playerId") String playerId) {
        log.info("Player {} leaving room {}", playerId, roomCode);
        restTemplate.delete(lobbyUrl + "/api/lobby/rooms/" + roomCode + "/leave?playerId=" + playerId);
        log.debug("Proxy leave room successful");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/rooms/{roomCode}")
    public ResponseEntity<Object> getRoom(@PathVariable String roomCode) {
        log.info("Fetching room layout for {}", roomCode);
        ResponseEntity<Object> response = restTemplate.getForEntity(lobbyUrl + "/api/lobby/rooms/" + roomCode, Object.class);
        log.debug("Proxy room retrieval successful, status: {}", response.getStatusCode());
        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
    }
}
