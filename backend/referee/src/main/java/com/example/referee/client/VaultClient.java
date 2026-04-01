package com.example.referee.client;

import com.example.referee.dto.MatchDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Slf4j
@Service
public class VaultClient {
    private final RestClient restClient;

    public VaultClient(@Value("${vault.url}") String vaultUrl) {
        this.restClient = RestClient.builder().baseUrl(vaultUrl).build();
    }

    public MatchDTO getMatch(String id) {
        log.debug("Fetching match {} from The Vault...", id);
        return restClient.get().uri("/internal/vault/matches/{id}", id).retrieve().body(MatchDTO.class);
    }

    public MatchDTO saveMatch(MatchDTO match) {
        log.debug("Saving updated match state back to The Vault...");
        return restClient.post().uri("/internal/vault/matches/save").body(match).retrieve().body(MatchDTO.class);
    }
}