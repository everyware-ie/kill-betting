package com.killnagi.domain.team.repository;

import com.killnagi.domain.team.entity.TeamPlayer;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamPlayerRepository extends JpaRepository<TeamPlayer, Long> {
    List<TeamPlayer> findByTeam_Id(Long teamId);
    int countByTeam_Id(Long teamId);
    boolean existsByTeam_IdAndPlayerNickname(Long teamId, String playerNickname);

    /**
     * 내가 리더였던 팀들에 등록했던 닉네임을 최근 순으로 조회한다.
     * 같은 닉네임이 여러 세션에 등장하면 가장 최근 등록 시점을 기준으로 한 번만 반환한다.
     */
    @Query("""
            SELECT p.playerNickname
            FROM TeamPlayer p
            WHERE p.team.leader.id = :leaderUserId
            GROUP BY p.playerNickname
            ORDER BY MAX(p.createdAt) DESC
            """)
    List<String> findRecentNicknamesByLeaderId(@Param("leaderUserId") Long leaderUserId, Pageable pageable);
}
