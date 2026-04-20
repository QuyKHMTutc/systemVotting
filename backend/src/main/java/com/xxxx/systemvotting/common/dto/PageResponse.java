package com.xxxx.systemvotting.common.dto;

import org.springframework.data.domain.Page;

import java.io.Serializable;
import java.util.List;

/**
 * Paginated response wrapper aligned with Spring Data {@link Page} getters.
 *
 * <p>{@code currentPage} is the <strong>0-based</strong> page index (same as {@link Page#getNumber()}),
 * matching typical API query params {@code page=0} for the first page.</p>
 *
 * <p>Kept as a class (not a record) because of the static factory {@link #from(Page)}.
 * All fields are final — effectively immutable after construction.</p>
 */
public final class PageResponse<T> implements Serializable {

    private static final long serialVersionUID = 1L;

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
