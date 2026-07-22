package com.killnagi.domain.session.dto.response;

/**
 * 세션별 참가자 수 집계 결과. 목록 조회 시 세션 페이지의 참가자 수를
 * 한 번의 배치 쿼리로 조회하기 위한 프로젝션.
 */
public record SessionParticipantCount(
        Long sessionId,
        long count
) {
}