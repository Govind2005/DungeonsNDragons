package com.dungeonsNdragons.bouncer.webSockets;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class SessionRegistry {
    private final Map<String, String> sessionToPlayer = new ConcurrentHashMap<>();
    private final Map<String, String> playerToSession = new ConcurrentHashMap<>();
    private final Map<String, String> sessionToMatch = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> matchToSessions = new ConcurrentHashMap<>();

    @EventListener
    public void onConnect(SessionConnectedEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = sha.getSessionId();
        String playerId = extractPlayerId(sha);
        if (playerId != null && sessionId != null) {
            sessionToPlayer.put(sessionId, playerId);
            playerToSession.put(playerId, sessionId);
            log.info("Player {} connected (session {})", playerId, sessionId);
        }
    }

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = sha.getSessionId();
        String destination = sha.getDestination();
        if (destination != null && destination.startsWith("/topic/match/")) {
            String matchId = destination.substring("/topic/match/".length());
            sessionToMatch.put(sessionId, matchId);
            matchToSessions.computeIfAbsent(matchId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
            log.info("Session {} subscribed to match {}", sessionId, matchId);
        }
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = sha.getSessionId();
        String playerId = sessionToPlayer.remove(sessionId);
        playerToSession.remove(playerId);
        String matchId = sessionToMatch.remove(sessionId);
        if (matchId != null) {
            Set<String> sessions = matchToSessions.get(matchId);
            if (sessions != null) {
                sessions.remove(sessionId);
                if (sessions.isEmpty())
                    matchToSessions.remove(matchId);
            }
            log.warn("Player {} disconnected from match {}", playerId, matchId);
        }
    }

    public String getSessionForPlayer(String playerId) {
        return playerToSession.get(playerId);
    }

    public String getPlayerForSession(String sessionId) {
        return sessionToPlayer.get(sessionId);
    }

    public String getMatchForSession(String sessionId) {
        return sessionToMatch.get(sessionId);
    }

    public Set<String> getSessionsForMatch(String matchId) {
        return matchToSessions.getOrDefault(matchId, Set.of());
    }

    public boolean isPlayerConnected(String playerId) {
        return playerToSession.containsKey(playerId);
    }

    private String extractPlayerId(StompHeaderAccessor sha) {
        if (sha.getUser() instanceof UsernamePasswordAuthenticationToken auth)
            return auth.getName();
        return null;
    }
}
