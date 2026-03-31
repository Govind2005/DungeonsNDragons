package com.dungeonsNdragons.bouncer.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@Controller
public class RoomController {

    @GetMapping("/createRoom")
    public ResponseEntity<?> createRoom() {
        
        // ask lobby manager to create a new room and return the room id to the client

        return new ResponseEntity<>("room id here", HttpStatus.OK);
    }

    @PostMapping("/joinRoom")
    public ResponseEntity<?> joinRoom(@RequestBody String roomId) {
        
        // ask lobby manager to add the player to the room

        return new ResponseEntity<>(HttpStatus.OK);
    }
    
}
