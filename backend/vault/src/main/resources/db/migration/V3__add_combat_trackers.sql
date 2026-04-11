-- Replace 'match_players' with whatever your actual table name is!
ALTER TABLE match_players
ADD COLUMN kills INTEGER NOT NULL DEFAULT 0,
ADD COLUMN damage_dealt INTEGER NOT NULL DEFAULT 0,
ADD COLUMN healing_done INTEGER NOT NULL DEFAULT 0;