package com.xxxx.systemvotting.common.dto;

import lombok.*;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;
import org.springframework.data.domain.Page;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class PageResponse<T> implements Serializable {
    private int currentPage;
    private int pageSize;
    private int totalPages;
    private long totalElements;

    @Builder.Default
    private List<T> content = new java.util.ArrayList<>();
}
