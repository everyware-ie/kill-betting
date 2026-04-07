package com.killnagi.domain.match.dto;

public class MatchDto {

    public record ScreenshotUploadResponse(
            Long matchId,
            String screenshotUrl
    ) {}
}
