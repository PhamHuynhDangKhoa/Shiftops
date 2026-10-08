package com.shiftops.common.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    /**
     * Store an uploaded file in the given subDirectory.
     * @param file the uploaded file
     * @param subDirectory subdirectory (e.g. "issues")
     * @return the relative storage path to access the file
     */
    String store(MultipartFile file, String subDirectory);

    /**
     * Load a file as a Spring Resource by its relative storage path.
     * @param storagePath the relative storage path
     * @return the resource
     */
    Resource loadAsResource(String storagePath);

    /**
     * Delete a file by its relative storage path.
     * @param storagePath the relative storage path
     */
    void delete(String storagePath);
}
