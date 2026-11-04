package com.backend.docmind.services;

import com.backend.docmind.dto.DocumentResponseDto;
import com.backend.docmind.repository.DocumentMetadataRepo;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor

public class DocumentMetadataService {
    private final DocumentMetadataRepo documentMetadataRepo;
    private final JdbcTemplate jdbcTemplate;
    private static final Logger log= LoggerFactory.getLogger(DocumentMetadataService.class);
    public DocumentResponseDto uploadAndProcess(MultipartFile file) {
        return null;
    }
}
