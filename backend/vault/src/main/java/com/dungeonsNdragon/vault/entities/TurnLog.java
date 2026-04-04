package com.dungeonsNdragon.vault.entities;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "turn_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TurnLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "match_id", nullable = false)
    private UUID matchId;

    @Column(name = "turn_number", nullable = false)
    private int turnNumber;

    @Column(name = "actor_player_id", nullable = false)
    private UUID actorPlayerId;

    @Column(name = "action_type", nullable = false)
    private String actionType;

    @Column(name = "target_player_id")
    private UUID targetPlayerId;

    @Column(name = "damage_dealt")
    private Integer damageDealt;

    @Column(name = "mana_used")
    private Integer manaUsed;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "effects_applied", columnDefinition = "jsonb")
    private Object effectsApplied;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "state_snapshot", columnDefinition = "jsonb")
    private Object stateSnapshot;

    @Column(name = "executed_at", nullable = false)
    private Instant executedAt;

    @PrePersist
    public void prePersist() {
        executedAt = Instant.now();
    }
}
