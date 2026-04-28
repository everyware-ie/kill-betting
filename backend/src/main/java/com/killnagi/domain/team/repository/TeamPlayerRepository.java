package com.killnagi.domain.team.repository;

import com.killnagi.domain.team.entity.TeamPlayer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamPlayerRepository extends JpaRepository<TeamPlayer, Long> {
    List<TeamPlayer> findByTeam_Id(Long teamId);
    int countByTeam_Id(Long teamId);
    boolean existsByTeam_IdAndPlayerNickname(Long teamId, String playerNickname);
}
