package com.dungeonsNdragons.bouncer.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/scribe")
@RequiredArgsConstructor
public class ScribeProxyController {
    private final RestTemplate restTemplate;
    @Value("${services.scribe.url:http://localhost:8084}")
    private String scribeUrl;

    @GetMapping("/leaderboard")
    public ResponseEntity<Object> getLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String url = scribeUrl + "/api/scribe/leaderboard?page=" + page + "&size=" + size;
        return restTemplate.getForEntity(url, Object.class);
    }
}
