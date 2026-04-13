package com.dungeonsNdragon.vault.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "matches")
@Getter
@Setter
public class Match {

    @Id
    private String matchId;

    private String status;

    private String currentTurn;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private java.util.Map<String, Object> gameState;

    @Version
    private Integer version;
}