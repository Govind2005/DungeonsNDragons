package com.example.scribe.client;

import com.example.scribe.dto.MatchDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class VaultClient {

    private final RestClient restClient;

    public VaultClient(@Value("${vault.url}") String vaultUrl) {
        this.restClient = RestClient.builder().baseUrl(vaultUrl).build();
    }

    public MatchDTO getFinishedMatch(String matchId) {
        return restClient.get()
                .uri("/internal/vault/matches/{id}", matchId)
                .retrieve()
                .body(MatchDTO.class);
    }
}