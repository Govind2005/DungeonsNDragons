-- Required for REFRESH MATERIALIZED VIEW CONCURRENTLY (Postgres needs unique index)
CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_player_id_idx ON leaderboard (id);
CREATE OR REPLACE VIEW match_player_stats AS
SELECT
t.match_id,
t.actor_player_id                          AS player_id,
SUM(COALESCE(t.damage_dealt, 0))           AS total_damage,
COUNT(CASE WHEN t.damage_dealt > 0 THEN 1 END) AS attack_count,
0                                           AS kills
FROM turn_log t
GROUP BY t.match_id, t.actor_player_id;
CREATE OR REPLACE FUNCTION match_survivors(p_match_id UUID)
RETURNS TABLE (player_id UUID, team INT, hp INT, alive BOOLEAN) AS $$
BEGIN
RETURN QUERY
SELECT p.player_id, p.team, p.hp, p.is_alive
FROM match_players p
WHERE p.match_id = p_match_id
ORDER BY p.turn_order;
END;
$$ LANGUAGE plpgsql;