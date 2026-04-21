package com.killnagi.domain.session.dto;

import com.killnagi.domain.rule.entity.Rule;
import com.killnagi.domain.session.entity.Session;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
            @NotNull(message = "룰 타입을 입력해주세요")
            Rule.RuleType ruleType,
            @NotNull(message = "연산자를 입력해주세요")
            Rule.Operator operator,
            int value
    ) {}

    public record SessionResponse(
            Long id,
            String name,
            String roomUrl,
            String hostNickname,
            Session.SessionStatus status,
            Integer targetKills,
            Integer timeLimitMinutes,
            LocalDateTime createdAt
    ) {}

    // 팀별 누적 스코어 스냅샷 (스코어보드 초기 로드용)
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
            int totalKills,
            int bonusKills,
            int penaltyKills,
            int effectiveKills
    ) {}

    // 매치별 결과 히스토리 (판 단위 조회용)
    public record MatchHistoryResponse(
            Long sessionId,
            String sessionName,
            int confirmedMatchCount,
            List<MatchSummary> matches
    ) {}

    public record MatchSummary(
            Long matchId,
            int matchNumber,
            String mapName,
            LocalDateTime playedAt,
            List<MemberMatchResult> memberResults
    ) {}

    public record MemberMatchResult(
            Long memberId,
            Long teamId,
            String teamName,
            String nickname,
            int kills,
            int bonusKills,
            int penaltyKills,
            int effectiveKills,
            Integer placement,
            boolean isChicken
    ) {}
}
