package com.dungeonsNdragons.bouncer.webSockets;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class GameBroadcaster {
    private final SimpMessagingTemplate messaging;
    private final RedisTemplate<String, Object> redis;
    private final ObjectMapper objectMapper;
    private final SessionRegistry sessionRegistry; // INJECTED SESSION REGISTRY

    @Value("${redis.match-channel-prefix:broadcast:match:}")
    private String channelPrefix;

    public void publishTurnResult(UUID matchId, Object turnResult) {
        redis.convertAndSend(channelPrefix + matchId, turnResult);
    }

    public void publishLobbyUpdate(Object lobbyEvent) {
        redis.convertAndSend("broadcast:lobby", lobbyEvent);
    }

    public void broadcastToMatch(UUID matchId, Object payload) {
        messaging.convertAndSend("/topic/match/" + matchId, payload);
    }

    public void broadcastToLobby(Object payload) {
        messaging.convertAndSend("/topic/lobby", payload);
    }

    public void sendToPlayer(String playerId, Object payload) {
        String sessionId = sessionRegistry.getSessionForPlayer(playerId);
        if (sessionId != null) {
            SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
            headerAccessor.setSessionId(sessionId);
            headerAccessor.setLeaveMutable(true);
            messaging.convertAndSendToUser(playerId, "/queue/errors", payload, headerAccessor.getMessageHeaders());
        }
    }

    public void notifyPlayersMatchStarted(Map<String, Object> payload) {
        List<Map<String, Object>> players = (List<Map<String, Object>>) payload.get("players");

        for (Map<String, Object> player : players) {
            String playerId = (String) player.get("playerId");
            String sessionId = sessionRegistry.getSessionForPlayer(playerId);

            // THE FIX: Explicitly target the user's session ID
            if (sessionId != null) {
                SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
                headerAccessor.setSessionId(sessionId);
                headerAccessor.setLeaveMutable(true);

                messaging.convertAndSendToUser(
                        playerId,
                        "/queue/match-start",
                        payload,
                        headerAccessor.getMessageHeaders());
                log.info("Delivered MATCH_START to player {} via session {}", playerId, sessionId);
            } else {
                log.warn("Cannot send MATCH_START - player {} has no active session", playerId);
            }
        }
    }
}