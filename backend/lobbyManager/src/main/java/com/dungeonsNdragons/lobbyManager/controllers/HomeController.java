package com.dungeonsNdragons.lobbyManager.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/home")
public class HomeController {
    @RequestMapping("")
    public ResponseEntity<?> home() {
        return new ResponseEntity<>("Welcome to the Dungeons & Dragons Bouncer API!", HttpStatus.OK);
    }
}