package com.backend.docmind.repository;

import com.backend.docmind.entity.DocumentMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DocumentMetadataRepo extends JpaRepository<DocumentMetadata, UUID> {

}
