package com.dungeonsNdragon.vault.entities;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "player_effects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerEffect {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_player_id", nullable = false)
    private MatchPlayer matchPlayer;

    @Enumerated(EnumType.STRING)
    @Column(name = "effect_type", nullable = false)
    private EffectType effectType;

    @Column(nullable = false)
    private int magnitude;

    @Column(name = "turns_remaining", nullable = false)
    private int turnsRemaining;

    @Column(name = "applied_at", nullable = false)
    private Instant appliedAt;

    @PrePersist
    public void prePersist() {
        appliedAt = Instant.now();
    }

    public enum EffectType {
        BIND,
        INVISIBLE,
        ATTACK_BUFF,
        DEFENSE_BUFF,
        ATTACK_DEBUFF,
        MANA_DRAIN
    }
}
