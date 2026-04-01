package com.example.referee.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ScribeClient {

    private final RestClient restClient;

    public ScribeClient(@Value("${scribe.url}") String scribeUrl) {
        this.restClient = RestClient.builder().baseUrl(scribeUrl).build();
    }

    public void reportGameOver(String matchId, String winner) {
        restClient.post()
                .uri("/internal/scribe/game-over/{id}?winner={winner}", matchId, winner)
                .retrieve()
                .toBodilessEntity();
    }
}