package com.dungeonsNdragon.refree.services;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.dungeonsNdragon.refree.entities.MatchState;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
@Component
@RequiredArgsConstructor
@Slf4j
public class MatchStateCache {
private final RedisTemplate<String, Object> redis;
private final ObjectMapper objectMapper;
private final RestTemplate restTemplate;

@Value("${services.vault.url}")
private String vaultUrl;

@Value("${redis.match-state-ttl-seconds:3600}")
private long stateTtlSeconds;

@Value("${redis.lock-ttl-seconds:10}")
private long lockTtlSeconds;

private String stateKey(UUID matchId) { return "match:" + matchId; }
private String lockKey(UUID matchId)  { return "lock:match:" + matchId; }

public MatchState getState(UUID matchId) {
    Object cached = redis.opsForValue().get(stateKey(matchId));
    if (cached != null) return objectMapper.convertValue(cached, MatchState.class);
    log.debug("Cache miss for match {} — fetching from Vault", matchId);
    Map vaultState = restTemplate.getForObject(
        vaultUrl + "/api/vault/matches/" + matchId + "/state", Map.class);
    MatchState state = objectMapper.convertValue(vaultState, MatchState.class);
    writeState(state);
    return state;
}

public void writeState(MatchState state) {
    redis.opsForValue().set(stateKey(state.getMatchId()), state, Duration.ofSeconds(stateTtlSeconds));
}

public void evict(UUID matchId) {
    redis.delete(stateKey(matchId));
    log.info("Evicted cache for match {}", matchId);
}

public String tryAcquireLock(UUID matchId) {
    String lockValue = UUID.randomUUID().toString();
    Boolean acquired = redis.opsForValue().setIfAbsent(
        lockKey(matchId), lockValue, lockTtlSeconds, TimeUnit.SECONDS);
    return Boolean.TRUE.equals(acquired) ? lockValue : null;
}

public void releaseLock(UUID matchId, String lockValue) {
    String key = lockKey(matchId);
    Object current = redis.opsForValue().get(key);
    if (lockValue.equals(current)) redis.delete(key);
}
}
