package com.backend.docmind.dto;

import com.backend.docmind.entity.DocumentStatus;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DocumentResponseDto {
    private UUID id;
    private String fileName;
    private String fileSize;
    private DocumentStatus status;
    private Integer chunksCreated;
    private String message;
}
