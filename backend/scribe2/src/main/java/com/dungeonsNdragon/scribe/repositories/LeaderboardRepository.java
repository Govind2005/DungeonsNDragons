package com.dungeonsNdragon.scribe.repositories;

import com.dungeonsNdragon.scribe.entities.LeaderboardEntry;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
/**

Read-only access to the leaderboard materialized view.
Scribe is the only service that calls REFRESH MATERIALIZED VIEW.
*/
public interface LeaderboardRepository extends Repository<LeaderboardEntry, UUID> {
    @Query(value ="SELECT id, username, wins, losses, xp, win_rate, " +"RANK() OVER (ORDER BY xp DESC, wins DESC) AS rank " +"FROM leaderboard LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Object[]> findTopPlayers(int limit, int offset);

    @Modifying
    @Transactional
    @Query(value = "REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard", nativeQuery = true)
    void refreshLeaderboard();
}