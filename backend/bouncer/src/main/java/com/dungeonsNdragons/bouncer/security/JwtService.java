package com.dungeonsNdragons.bouncer.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
@Service
@Slf4j
public class JwtService {
private final Algorithm algorithm;
private final long expiryHours;

public JwtService(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.expiry-hours:24}") long expiryHours) {
    this.algorithm = Algorithm.HMAC256(secret);
    this.expiryHours = expiryHours;
}

public String issueToken(UUID playerId, String email, String username) {
    Instant now = Instant.now();
    return JWT.create()
        .withIssuer("dnd-game")
        .withSubject(playerId.toString())
        .withClaim("email", email)
        .withClaim("username", username)
        .withIssuedAt(Date.from(now))
        .withExpiresAt(Date.from(now.plus(expiryHours, ChronoUnit.HOURS)))
        .sign(algorithm);
}

public DecodedJWT verify(String token) {
    try {
        return JWT.require(algorithm).withIssuer("dnd-game").build().verify(token);
    } catch (JWTVerificationException e) {
        log.warn("JWT verification failed: {}", e.getMessage());
        throw e;
    }
}

public UUID extractPlayerId(String token) {
    return UUID.fromString(verify(token).getSubject());
}

public String extractUsername(String token) {
    return verify(token).getClaim("username").asString();
}

public String extractFromHeader(String authHeader) {
    if (authHeader != null && authHeader.startsWith("Bearer ")) return authHeader.substring(7);
    throw new IllegalArgumentException("Missing or malformed Authorization header");
}
}
