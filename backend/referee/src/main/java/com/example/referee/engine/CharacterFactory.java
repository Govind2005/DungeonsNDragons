package com.example.referee.engine;

public class CharacterFactory {
    public static CharacterClass getCharacter(String className) {
        return switch (className.toUpperCase()) {
            case "BARBARIAN" -> new Barbarian();
            case "KNIGHT" -> new Knight();
            case "RANGER" -> new Ranger();
            case "WIZARD" -> new Wizard();
            default -> throw new IllegalArgumentException("Unknown class: " + className);
        };
    }
}