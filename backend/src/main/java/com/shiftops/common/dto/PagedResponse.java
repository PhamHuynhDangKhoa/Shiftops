package com.shiftops.common.dto;

import lombok.Builder;
import org.springframework.data.domain.Page;

import java.util.List;

@Builder
public record PagedResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
    public static <T> PagedResponse<T> of(Page<T> springPage) {
        return PagedResponse.<T>builder()
                .content(springPage.getContent())
                .page(springPage.getNumber())
                .size(springPage.getSize())
                .totalElements(springPage.getTotalElements())
                .totalPages(springPage.getTotalPages())
                .last(springPage.isLast())
                .build();
    }

    public List<T> getContent() {
        return content();
    }

    public int getPage() {
        return page();
    }

    public int getSize() {
        return size();
    }

    public long getTotalElements() {
        return totalElements();
    }

    public int getTotalPages() {
        return totalPages();
    }

    public boolean isLast() {
        return last();
    }
}
