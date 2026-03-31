package com.dungeonsNdragons.lobbyManager.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@Controller
public class RoomController {

    @GetMapping("/createRoom/{id}")
    public ResponseEntity<?> createRoom(@RequestParam(name="id") String creatorId) {
        
        String roomID = "";
        // generate random room ID
        // check if room ID already exists in database
        // if it does, generate a new one until we get a unique ID
        // save the room ID and creator ID to the database and make the room inactive until 4 players have joined

        return new ResponseEntity<>(roomID, HttpStatus.OK);
    }

    @GetMapping("/joinRoom/{id}")
    public ResponseEntity<?> joinRoom(@RequestParam(name="id") String roomId) {
        // check if room ID exists in database
        // if it does, add the user to the room
        // if the room contains 4 players, start the game that is make the room active
        // if it doesn't, return an error message

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/deleteRoom/{id}")
    public ResponseEntity<?> deleteRoom(@RequestParam(name="id") String roomId) {
        // check if room ID exists in database
        // if it does, delete the room
        // if it doesn't, return an error message

        return new ResponseEntity<>(HttpStatus.OK);
    }
    
    
}
