package com.dungeonsNdragons.lobbyManager.services;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
                .roomCode(roomCode).playersReady(0).status(Room.RoomStatus.WAITING).players(new ArrayList<>()).build();
        room.getPlayers().add(Room.RoomPlayer.builder()
                .playerId(creatorPlayerId).username(creatorUsername).turnOrder(1).team(1).build());
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
            // initializeMatch(room); removed this because now the frontend will call api
            // for starting the match giving characters and then we call this method
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

    public void selectCharacter(String roomCode, String playerId, String characterClass) {
        Room room = getRoom(roomCode);
        if (room == null)
            throw new IllegalArgumentException("Room not found: " + roomCode);
        if (room.getPlayers().stream().noneMatch(p -> p.getPlayerId().equals(playerId)))
            throw new IllegalStateException("Not a member of this room");

        room.getPlayers().forEach(p -> {
            if (p.getPlayerId().equals(playerId)) {
                p.setCharacterClass(characterClass);
            }
        });
        saveRoom(room);
        broadcastRoomUpdate(room);
        log.info("Player {} selected character {} in room {}", playerId, characterClass, roomCode);
    }

    public void playerReady(String roomCode, String playerId) {
        Room room = getRoom(roomCode);
        if (room == null)
            throw new IllegalArgumentException("Room not found: " + roomCode);
        if (room.getStatus() != Room.RoomStatus.STARTING && room.getStatus() != Room.RoomStatus.WAITING)
            throw new IllegalStateException("Room is not ready to accept ready status");
        if (room.getPlayers().stream().noneMatch(p -> p.getPlayerId().equals(playerId)))
            throw new IllegalStateException("Not a member of this room");

        room.getPlayers().forEach(p -> {
            if (p.getPlayerId().equals(playerId)) {
                p.setReady(true);
            }
        });

        long readyCount = room.getPlayers().stream().filter(Room.RoomPlayer::isReady).count();
        room.setPlayersReady((int) readyCount);

        // CHANGE 1: Move these outside the if/else block!
        // This guarantees the frontend is notified that the 4th player clicked "Ready"
        saveRoom(room);
        broadcastRoomUpdate(room);

        // CHANGE 2: Try to start the match AFTER broadcasting the UI update
        if (readyCount == MAX_PLAYERS) {
            initializeMatch(room);
        }
    }

    private void initializeMatch(Room room) {
        try {
            List<Map<String, Object>> players = room.getPlayers().stream()
                    .map(p -> Map.<String, Object>of(
                            "playerId", p.getPlayerId(),
                            "team", p.getTeam(),
                            "turnOrder", p.getTurnOrder(),
                            "characterClass", p.getCharacterClass() != null ? p.getCharacterClass() : "BARBARIAN"))
                    .toList();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<Map> resp = restTemplate.postForEntity(
                    vaultUrl + "/api/vault/matches",
                    new HttpEntity<>(Map.of("players", players), headers),
                    Map.class);

            Map<String, Object> vaultResp = (Map<String, Object>) resp.getBody();
            String matchId = (String) vaultResp.get("matchId");
            room.setMatchId(matchId);
            room.setStatus(Room.RoomStatus.IN_GAME);
            saveRoom(room);

            log.info("Match {} initialized for room {}", matchId, room.getRoomCode());
            broadcastMatchStart(room, matchId, vaultResp);

        } catch (Exception e) {
            log.error("Failed to initialize match for room {}: {}", room.getRoomCode(), e.getMessage());

            // 1. Reset the room status back to waiting
            room.setStatus(Room.RoomStatus.WAITING);

            // 2. Un-ready everyone so they can try clicking ready again
            room.getPlayers().forEach(p -> p.setReady(false));
            room.setPlayersReady(0);

            // 3. Save the room and put it back in the available pool
            saveRoom(room);
            redis.opsForSet().add(AVAILABLE_ROOMS_KEY, room.getRoomCode());

            // 4. Tell the frontend about the reset so the screen updates
            broadcastRoomUpdate(room);
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
                            .map(p -> {
                                java.util.Map<String, Object> map = new java.util.HashMap<>();
                                map.put("playerId", p.getPlayerId());
                                map.put("username", p.getUsername());
                                map.put("team", p.getTeam());
                                map.put("turnOrder", p.getTurnOrder());
                                map.put("characterClass", p.getCharacterClass());
                                map.put("isReady", p.isReady());
                                return map;
                            })
                            .toList(),
                    "status", room.getStatus().name()));
        } catch (Exception e) {
            log.warn("Failed to broadcast room update: {}", e.getMessage());
        }
    }

    private void broadcastMatchStart(Room room, String matchId, Map<String, Object> vaultState) {
        try {
            List<Map<String, Object>> vaultPlayers = (List<Map<String, Object>>) vaultState.get("players");
            
            redis.convertAndSend("broadcast:lobby", Map.of(
                "type", "MATCH_START", 
                "roomCode", room.getRoomCode(), 
                "matchId", matchId,
                "currentTurn", vaultState.getOrDefault("currentTurn", 1),
                "players", room.getPlayers().stream().map(p -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("playerId", p.getPlayerId());
                    map.put("username", p.getUsername());
                    map.put("team", p.getTeam());
                    map.put("turnOrder", p.getTurnOrder());
                    map.put("characterClass", p.getCharacterClass());
                    map.put("isReady", p.isReady());
                    
                    // Add stats from vault
                    if (vaultPlayers != null) {
                        vaultPlayers.stream()
                            .filter(vp -> vp.get("playerId").equals(p.getPlayerId()))
                            .findFirst()
                            .ifPresent(vp -> {
                                map.put("currentHp", vp.get("hp"));
                                map.put("maxHp", vp.get("maxHp"));
                                map.put("currentMana", vp.get("mana"));
                                map.put("maxMana", vp.get("maxMana"));
                            });
                    }
                    return map;
                }).toList()));
        } catch (Exception e) {
            log.warn("Failed to broadcast match start: {}", e.getMessage());
        }
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
