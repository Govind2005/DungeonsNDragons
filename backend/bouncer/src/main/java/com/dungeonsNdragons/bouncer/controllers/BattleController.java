package com.dungeonsNdragons.bouncer.controllers;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.dungeonsNdragons.bouncer.dto.GameAction;
import com.dungeonsNdragons.bouncer.dto.GameResponse;


@Controller
public class BattleController {

    private SimpMessagingTemplate messagingTemplate;

    public BattleController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/game-action")
    public void handleGameAction(GameAction gameAction) {
        // check whether the room is active or not using db

        // call refree

        // create a GameResponse object based on the result of the action and send it back to the clients in the same room
        GameResponse gameResponse = new GameResponse();
        // set the fields of gameResponse based on the result of the action
        gameResponse.setRoomId(gameAction.getRoomId());
        gameResponse.setPlayerId(gameAction.getPlayerId());
        gameResponse.setActionType(gameAction.getActionType());
        gameResponse.setCharacter(gameAction.getCharacter());
        gameResponse.setTargetId(gameAction.getTargetId());
        gameResponse.setAction(gameAction.getAction());
        // set other fields of gameResponse based on the result of the action

        String destination = "/topic/whichRoom/" + gameAction.getRoomId();
        messagingTemplate.convertAndSend(destination, gameResponse);
    }
    
}
