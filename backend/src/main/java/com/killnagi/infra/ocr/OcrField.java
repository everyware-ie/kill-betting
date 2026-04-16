package com.killnagi.infra.ocr;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OcrField {
    private String text;
    private double x;
    private double y;
}