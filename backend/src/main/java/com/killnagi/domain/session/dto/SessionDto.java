package com.killnagi.domain.session.dto;

import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.session.entity.Session;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class SessionDto {

    public record CreateRequest(
            @NotBlank(message = "세션 이름을 입력해주세요")
            @Size(max = 100)
            String name,
            Integer targetKills,
            Integer timeLimitMinutes,
            List<RuleRequest> rules
    ) {}

    public record RuleRequest(
            Rule.RuleType ruleType,
            int killValue
    ) {}

    public record SessionResponse(
            Long id,
            String name,
            String hostNickname,
            Session.SessionStatus status,
            Integer targetKills,
            Integer timeLimitMinutes,
            LocalDateTime createdAt
    ) {}

    public record ScoreboardResponse(
            Long sessionId,
            String sessionName,
            Session.SessionStatus status,
            List<TeamScoreDto> teams
    ) {}

    public record TeamScoreDto(
            Long teamId,
            String teamName,
            int totalKills,
            int bonusKills,
            int penaltyKills,
            int effectiveKills,
            List<MemberScoreDto> members
    ) {}

    public record MemberScoreDto(
            Long userId,
            String nickname,
            int totalKills
    ) {}
}
