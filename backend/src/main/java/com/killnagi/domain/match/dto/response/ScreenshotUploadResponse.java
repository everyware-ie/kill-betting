package com.killnagi.domain.match.dto.response;

import com.killnagi.infra.ocr.MatchOcrResult;

public record ScreenshotUploadResponse(
        Long matchId,
        String screenshotUrl,
        MatchOcrResult ocrResult
) {}
