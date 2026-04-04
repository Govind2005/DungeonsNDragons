CREATE TABLE players (
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
google_id   VARCHAR(128) UNIQUE NOT NULL,
username    VARCHAR(64)  NOT NULL,
email       VARCHAR(255) UNIQUE NOT NULL,
wins        INT NOT NULL DEFAULT 0,
losses      INT NOT NULL DEFAULT 0,
xp          INT NOT NULL DEFAULT 0,
created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE matches (
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
status          VARCHAR(32) NOT NULL DEFAULT 'WAITING',
winner_team     INT,
started_at      TIMESTAMPTZ,
ended_at        TIMESTAMPTZ,
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE match_players (
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
player_id       UUID NOT NULL REFERENCES players(id),
team            INT NOT NULL CHECK (team IN (1, 2)),
turn_order      INT NOT NULL CHECK (turn_order BETWEEN 1 AND 4),
character_class VARCHAR(32) NOT NULL,
hp              INT NOT NULL,
max_hp          INT NOT NULL,
mana            INT NOT NULL,
max_mana        INT NOT NULL,
is_alive        BOOLEAN NOT NULL DEFAULT TRUE,
UNIQUE (match_id, turn_order),
UNIQUE (match_id, player_id)
);
CREATE TABLE player_effects (
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
match_player_id UUID NOT NULL REFERENCES match_players(id) ON DELETE CASCADE,
effect_type     VARCHAR(32) NOT NULL,
magnitude       INT NOT NULL DEFAULT 1,
turns_remaining INT NOT NULL,
applied_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE turn_log (
id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
match_id         UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
turn_number      INT NOT NULL,
actor_player_id  UUID NOT NULL REFERENCES players(id),
action_type      VARCHAR(64) NOT NULL,
target_player_id UUID REFERENCES players(id),
damage_dealt     INT,
mana_used        INT,
effects_applied  JSONB,
state_snapshot   JSONB,
executed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE MATERIALIZED VIEW leaderboard AS
SELECT
p.id,
p.username,
p.wins,
p.losses,
p.xp,
CASE WHEN (p.wins + p.losses) = 0 THEN 0
ELSE ROUND(p.wins::NUMERIC / (p.wins + p.losses) * 100, 2)
END AS win_rate
FROM players p
ORDER BY p.xp DESC, p.wins DESC;
CREATE INDEX idx_match_players_match  ON match_players(match_id);
CREATE INDEX idx_match_players_player ON match_players(player_id);
CREATE INDEX idx_player_effects_mp    ON player_effects(match_player_id);
CREATE INDEX idx_turn_log_match       ON turn_log(match_id);
CREATE INDEX idx_matches_status       ON matches(status);