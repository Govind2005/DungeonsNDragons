package com.dungeonsNdragons.bouncer.controllers;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import com.dungeonsNdragons.bouncer.security.JwtService;
import com.dungeonsNdragons.bouncer.webSockets.GameBroadcaster;
import com.dungeonsNdragons.bouncer.webSockets.SessionRegistry;

import java.util.Map;
import java.util.UUID;
@Controller
@RequiredArgsConstructor
@Slf4j
public class GameController {
private final GameBroadcaster broadcaster;
private final SessionRegistry sessionRegistry;
private final JwtService jwtService;
private final RestTemplate restTemplate;

@Value("${services.referee.url}")
private String refereeUrl;

/** Primary path: player sends action via STOMP to /app/action */
@MessageMapping("/action")
public void handleAction(@Payload ActionMessage action, SimpMessageHeaderAccessor sha) {
    Authentication auth = (Authentication) sha.getUser();
    if (auth == null) { log.warn("Unauthenticated WS action rejected"); return; }

    UUID actorPlayerId = UUID.fromString(auth.getName());
    String matchId = sessionRegistry.getMatchForSession(sha.getSessionId());

    if (matchId == null) {
        broadcaster.sendToPlayer(auth.getName(), Map.of("error", "You are not subscribed to any match"));
        return;
    }
    if (!actorPlayerId.toString().equals(action.getActorPlayerId())) {
        broadcaster.sendToPlayer(auth.getName(), Map.of("error", "Cannot submit action for another player"));
        return;
    }
    forwardToReferee(action, UUID.fromString(matchId), actorPlayerId);
}

/** REST fallback for clients that can't use WebSocket */
@PostMapping("/api/game/action")
@ResponseBody
public ResponseEntity<Map<String, Object>> handleActionRest(
        @RequestBody ActionMessage action,
        @RequestHeader("Authorization") String authHeader) {
    try {
        UUID actorPlayerId = jwtService.extractPlayerId(jwtService.extractFromHeader(authHeader));
        forwardToReferee(action, UUID.fromString(action.getMatchId()), actorPlayerId);
        return ResponseEntity.ok(Map.of("status", "processing"));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}

private void forwardToReferee(ActionMessage action, UUID matchId, UUID actorPlayerId) {
    try {
        Map<String, Object> refereeReq = new java.util.HashMap<>();
        refereeReq.put("matchId", matchId);
        refereeReq.put("actorPlayerId", actorPlayerId);
        refereeReq.put("actionType", action.getActionType());
        refereeReq.put("targetPlayerId", action.getTargetPlayerId() != null ? action.getTargetPlayerId() : "");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> resp = restTemplate.postForEntity(
            refereeUrl + "/api/referee/action", new HttpEntity<>(refereeReq, headers), Map.class);

        Map<String, Object> result = resp.getBody();
        if (Boolean.FALSE.equals(result.get("valid"))) {
            broadcaster.sendToPlayer(actorPlayerId.toString(),
                Map.of("type", "ACTION_REJECTED", "reason", result.get("rejectionReason")));
        } else {
            broadcaster.publishTurnResult(matchId,
                Map.of("type", "TURN_RESULT", "matchId", matchId, "data", result));
        }
    } catch (Exception e) {
        log.error("Error forwarding to Referee for match {}: {}", matchId, e.getMessage());
        broadcaster.sendToPlayer(actorPlayerId.toString(),
            Map.of("type", "ERROR", "message", "Server error processing action"));
    }
}

@Data public static class ActionMessage {
    private String matchId;
    private String actorPlayerId;
    private String actionType;
    private String targetPlayerId;
}
}
