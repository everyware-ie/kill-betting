package com.killnagi.infra.ocr;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerStat {
    private String nickname;
    private int kills;
    private int damage;
    private int assists;
}