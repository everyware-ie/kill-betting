package com.killnagi.domain.match.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.common.storage.FileStorageService;
import com.killnagi.domain.match.dto.MatchDto;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class MatchService {

    private static final String SCREENSHOT_DIR = "screenshots";

    private final MatchRepository matchRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public MatchDto.ScreenshotUploadResponse uploadScreenshot(Long matchId, MultipartFile file) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> KillnagiException.notFound("매치를 찾을 수 없습니다."));

        String url = fileStorageService.store(file, SCREENSHOT_DIR);
        match.updateScreenshotUrl(url);

        return new MatchDto.ScreenshotUploadResponse(match.getId(), url);
    }
}
