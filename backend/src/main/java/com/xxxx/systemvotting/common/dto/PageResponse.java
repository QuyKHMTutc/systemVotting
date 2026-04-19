package com.xxxx.systemvotting.common.dto;

import org.springframework.data.domain.Page;

import java.io.Serializable;
import java.util.List;

/**
 * Paginated response wrapper.
 *
 * Kept as a class (not a record) because it has a static factory method
 * {@link #from(Page)} that performs mapping logic.
 * All fields are final — effectively immutable after construction.
 */
public final class PageResponse<T> implements Serializable {

    private final int        currentPage;
    private final int        pageSize;
    private final int        totalPages;
    private final long       totalElements;
    private final List<T>    content;

    private PageResponse(int currentPage, int pageSize, int totalPages, long totalElements, List<T> content) {
        this.currentPage   = currentPage;
        this.pageSize      = pageSize;
        this.totalPages    = totalPages;
        this.totalElements = totalElements;
        this.content       = List.copyOf(content);   // defensive copy — unmodifiable
    }

    /** Convenience factory: creates a PageResponse directly from a Spring Data {@link Page}. */
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getNumber(),
                page.getSize(),
                page.getTotalPages(),
                page.getTotalElements(),
                page.getContent()
        );
    }

    public int     getCurrentPage()   { return currentPage; }
    public int     getPageSize()      { return pageSize; }
    public int     getTotalPages()    { return totalPages; }
    public long    getTotalElements() { return totalElements; }
    public List<T> getContent()       { return content; }
}
