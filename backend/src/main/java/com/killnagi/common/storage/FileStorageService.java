package com.killnagi.common.storage;

import com.killnagi.common.exception.KillnagiException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

public interface FileStorageService {

    long MAX_FILE_SIZE = 10 * 1024 * 1024;
    Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/jpg");

    /**
     * 파일을 저장하고 접근 가능한 URL을 반환한다.
     */
    String store(MultipartFile file, String directory);

    default void validate(MultipartFile file) {
        if (file.isEmpty()) {
            throw KillnagiException.badRequest("파일이 비어있습니다.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw KillnagiException.badRequest("파일 크기는 10MB를 초과할 수 없습니다.");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw KillnagiException.badRequest("JPEG, JPG, PNG 형식의 이미지만 업로드 가능합니다.");
        }
    }

    default String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }
}
