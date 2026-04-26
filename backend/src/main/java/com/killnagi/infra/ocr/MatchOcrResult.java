package com.killnagi.infra.ocr;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MatchOcrResult {
    private final int placement;
    private final String mapName;
    private final String playTime;
    private final List<PlayerStat> playerStats;
}