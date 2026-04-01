package com.example.referee.engine;

import java.util.List;
import java.util.Map;

public interface CharacterClass {
    String getClassName();

    // The engine passes the attacker, all targets, and the ally directly to the class
    void executeMove(String moveName,
                     Map<String, Object> attacker,
                     List<Map<String, Object>> targets,
                     Map<String, Object> ally);
}