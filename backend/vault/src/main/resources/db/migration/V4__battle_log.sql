CREATE TABLE battle_logs (
    match_id UUID PRIMARY KEY,
    winner_team VARCHAR(10),
    player1 VARCHAR(100),
    player2 VARCHAR(100),
    player3 VARCHAR(100),
    player4 VARCHAR(100),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);