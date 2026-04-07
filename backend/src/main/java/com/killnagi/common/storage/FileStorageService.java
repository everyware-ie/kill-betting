package com.killnagi.common.storage;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    /**
     * 파일을 저장하고 접근 가능한 URL을 반환한다.
     */
    String store(MultipartFile file, String directory);
}
