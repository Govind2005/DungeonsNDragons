package com.dungeonsNdragons.bouncer.controllers;

import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.dungeonsNdragons.bouncer.security.JwtService;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final JwtService jwtService;
    private final RestTemplate restTemplate;

    @Value("${services.vault.url}")
    private String vaultUrl;

    /**
     * Frontend sends Google ID token here.
     * We verify it with Google, upsert the player in Vault, and issue our own JWT.
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@RequestBody GoogleAuthRequest req) {
        try {
            String verifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + req.getIdToken();
            ResponseEntity<Map> googleResponse = restTemplate.getForEntity(verifyUrl, Map.class);
            if (!googleResponse.getStatusCode().is2xxSuccessful() || googleResponse.getBody() == null)
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(AuthResponse.error("Invalid Google token"));

            Map<String, Object> claims = googleResponse.getBody();
            String googleId = (String) claims.get("sub");
            String email = (String) claims.get("email");
            String name = (String) claims.get("name");

            Map<String, String> upsertReq = Map.of(
                    "googleId", googleId,
                    "username", name != null ? name : email.split("@")[0],
                    "email", email);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<Map> vaultResp = restTemplate.postForEntity(
                    vaultUrl + "/api/vault/players/upsert", new HttpEntity<>(upsertReq, headers), Map.class);

            Map<String, Object> playerData = vaultResp.getBody();
            UUID playerId = UUID.fromString((String) playerData.get("id"));
            String username = (String) playerData.get("username");

            String token = jwtService.issueToken(playerId, email, username);
            log.info("Issued JWT for player {} ({})", username, playerId);
            return ResponseEntity.ok(AuthResponse.success(token, playerId, username, email));

        } catch (Exception e) {
            log.error("Auth failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.error("Authentication failed: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(@RequestHeader("Authorization") String authHeader) {
        try {
            var jwt = jwtService.verify(jwtService.extractFromHeader(authHeader));
            return ResponseEntity.ok(Map.of(
                    "playerId", jwt.getSubject(),
                    "username", jwt.getClaim("username").asString(),
                    "email", jwt.getClaim("email").asString()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @Data
    public static class GoogleAuthRequest {
        private String idToken;
    }

    @Data
    public static class AuthResponse {
        private boolean success;
        private String token, error, username, email;
        private UUID playerId;

        static AuthResponse success(String token, UUID id, String username, String email) {
            AuthResponse r = new AuthResponse();
            r.success = true;
            r.token = token;
            r.playerId = id;
            r.username = username;
            r.email = email;
            return r;
        }

        static AuthResponse error(String msg) {
            AuthResponse r = new AuthResponse();
            r.success = false;
            r.error = msg;
            return r;
        }
    }
}
