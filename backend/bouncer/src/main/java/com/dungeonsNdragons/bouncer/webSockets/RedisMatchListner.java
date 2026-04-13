package com.dungeonsNdragons.bouncer.webSockets;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
class RedisMatchListener implements MessageListener {
    private final GameBroadcaster broadcaster;
    private final ObjectMapper objectMapper;
    private final RedisMessageListenerContainer container;

    @Value("${redis.match-channel-prefix:broadcast:match:}")
    private String channelPrefix;

    @PostConstruct
    public void init() {
        container.addMessageListener(this, new PatternTopic(channelPrefix + "*"));
        container.addMessageListener(this, new PatternTopic("broadcast:lobby"));
        log.info("Redis Pub/Sub listener registered");
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String channel = new String(message.getChannel());
            Map<String, Object> payload = objectMapper.readValue(message.getBody(), Map.class);

            if (channel.startsWith(channelPrefix)) {
                UUID matchId = UUID.fromString(channel.substring(channelPrefix.length()));
                broadcaster.broadcastToMatch(matchId, payload);

            } else if ("broadcast:lobby".equals(channel)) {
                // THE FIX IS HERE: Check if it's a match start
                if ("MATCH_START".equals(payload.get("type"))) {
                    broadcaster.notifyPlayersMatchStarted(payload);
                } else {
                    // Otherwise, it's just a normal room update, send to public lobby
                    broadcaster.broadcastToLobby(payload);
                }
            }
        } catch (Exception e) {
            log.error("Error processing Redis message: {}", e.getMessage(), e);
        }
    }
}
