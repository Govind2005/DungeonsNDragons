package com.dungeonsNdragons.lobbyManager.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class LobbyService {
    private final RedisTemplate<String, Object> redis;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${services.vault.url}")
    private String vaultUrl;

    @Value("${lobby.room-ttl-minutes:30}")
    private long roomTtlMinutes;

    private static final int MAX_PLAYERS = 4;
    private static final String ROOM_KEY_PREFIX = "room:";
    private static final String AVAILABLE_ROOMS_KEY = "rooms:available";

    public Room createRoom(String creatorPlayerId, String creatorUsername) {
        String roomCode = generateRoomCode();
        Room room = Room.builder()
                .roomCode(roomCode).status(Room.RoomStatus.WAITING).players(new ArrayList<>()).build();
        room.getPlayers().add(Room.RoomPlayer.builder()
                .playerId(creatorPlayerId).username(creatorUsername).turnOrder(1).build());
        saveRoom(room);
        redis.opsForSet().add(AVAILABLE_ROOMS_KEY, roomCode);
        log.info("Room {} created by {}", roomCode, creatorUsername);
        return room;
    }

    public Room joinRoom(String roomCode, String playerId, String username, String characterClass) {
        Room room = getRoom(roomCode);
        if (room == null)
            throw new IllegalArgumentException("Room not found: " + roomCode);
        if (room.getStatus() != Room.RoomStatus.WAITING)
            throw new IllegalStateException("Room is not open");
        if (room.getPlayers().size() >= MAX_PLAYERS)
            throw new IllegalStateException("Room is full");
        if (room.getPlayers().stream().anyMatch(p -> p.getPlayerId().equals(playerId)))
            throw new IllegalStateException("Already in this room");

        int turnOrder = room.getPlayers().size() + 1;
        room.getPlayers().add(Room.RoomPlayer.builder()
                .playerId(playerId).username(username).characterClass(characterClass)
                .turnOrder(turnOrder).team(turnOrder <= 2 ? 1 : 2).build());

        if (room.getPlayers().size() == MAX_PLAYERS) {
            room.setStatus(Room.RoomStatus.STARTING);
            saveRoom(room);
            redis.opsForSet().remove(AVAILABLE_ROOMS_KEY, roomCode);
            initializeMatch(room);
        } else {
            saveRoom(room);
        }
        broadcastRoomUpdate(room);
        return room;
    }

    public Room quickJoin(String playerId, String username, String characterClass) {
        Set<Object> available = redis.opsForSet().members(AVAILABLE_ROOMS_KEY);
        if (available != null) {
            for (Object code : available) {
                try {
                    return joinRoom((String) code, playerId, username, characterClass);
                } catch (Exception e) {
                    log.debug("Quick join failed for {}: {}", code, e.getMessage());
                }
            }
        }
        return createRoom(playerId, username);
    }

    public void leaveRoom(String roomCode, String playerId) {
        Room room = getRoom(roomCode);
        if (room == null)
            return;
        room.getPlayers().removeIf(p -> p.getPlayerId().equals(playerId));
        if (room.getPlayers().isEmpty()) {
            deleteRoom(roomCode);
        } else {
            for (int i = 0; i < room.getPlayers().size(); i++) {
                room.getPlayers().get(i).setTurnOrder(i + 1);
                room.getPlayers().get(i).setTeam(i < 2 ? 1 : 2);
            }
            saveRoom(room);
            broadcastRoomUpdate(room);
        }
    }

    private void initializeMatch(Room room) {
        try {
            List<Map<String, Object>> players = room.getPlayers().stream()
                    .map(p -> Map.<String, Object>of(
                            "playerId", p.getPlayerId(), "team", p.getTeam(),
                            "turnOrder", p.getTurnOrder(),
                            "characterClass", p.getCharacterClass() != null ? p.getCharacterClass() : "BARBARIAN"))
                    .toList();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<Map> resp = restTemplate.postForEntity(
                    vaultUrl + "/api/vault/matches",
                    new HttpEntity<>(Map.of("players", players), headers), Map.class);

            String matchId = (String) resp.getBody().get("matchId");
            room.setMatchId(matchId);
            room.setStatus(Room.RoomStatus.IN_GAME);
            saveRoom(room);
            log.info("Match {} initialized for room {}", matchId, room.getRoomCode());
            broadcastMatchStart(room, matchId);
        } catch (Exception e) {
            log.error("Failed to initialize match for room {}: {}", room.getRoomCode(), e.getMessage());
            room.setStatus(Room.RoomStatus.WAITING);
            saveRoom(room);
            redis.opsForSet().add(AVAILABLE_ROOMS_KEY, room.getRoomCode());
        }
    }

    private void saveRoom(Room room) {
        redis.opsForValue().set(ROOM_KEY_PREFIX + room.getRoomCode(), room, Duration.ofMinutes(roomTtlMinutes));
    }

    public Room getRoom(String roomCode) {
        Object raw = redis.opsForValue().get(ROOM_KEY_PREFIX + roomCode);
        return raw == null ? null : objectMapper.convertValue(raw, Room.class);
    }

    private void deleteRoom(String roomCode) {
        redis.delete(ROOM_KEY_PREFIX + roomCode);
        redis.opsForSet().remove(AVAILABLE_ROOMS_KEY, roomCode);
    }

    private void broadcastRoomUpdate(Room room) {
        try {
            redis.convertAndSend("broadcast:lobby", Map.of(
                    "type", "ROOM_UPDATE", "roomCode", room.getRoomCode(),
                    "players", room.getPlayers().stream()
                            .map(p -> Map.of("username", p.getUsername(), "team", p.getTeam())).toList(),
                    "status", room.getStatus().name()));
        } catch (Exception e) {
            log.warn("Failed to broadcast room update: {}", e.getMessage());
        }
    }

    private void broadcastMatchStart(Room room, String matchId) {
        redis.convertAndSend("broadcast:lobby", Map.of(
                "type", "MATCH_START", "roomCode", room.getRoomCode(), "matchId", matchId,
                "players", room.getPlayers().stream().map(p -> Map.of(
                        "playerId", p.getPlayerId(), "username", p.getUsername(),
                        "team", p.getTeam(), "turnOrder", p.getTurnOrder(),
                        "characterClass", p.getCharacterClass() != null ? p.getCharacterClass() : "BARBARIAN"))
                        .toList()));
    }

    private String generateRoomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 6; i++)
            code.append(chars.charAt(random.nextInt(chars.length())));
        return code.toString();
    }
}
