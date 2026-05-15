package com.xxxx.systemvotting.modules.poll.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.poll.dto.CategoryDTO;
import com.xxxx.systemvotting.modules.poll.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Categories", description = "Danh mục dùng để phân loại cuộc thăm dò")
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(summary = "Lấy tất cả danh mục", description = "Trả về danh sách danh mục sắp xếp theo sortOrder tăng dần")
    @GetMapping
    public ApiResponse<List<CategoryDTO>> getAllCategories() {
        List<CategoryDTO> categories = categoryService.getAllCategories();
        return ApiResponse.<List<CategoryDTO>>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(categories)
                .build();
    }

    @Operation(summary = "Lấy danh mục theo slug")
    @GetMapping("/{slug}")
    public ApiResponse<CategoryDTO> getCategoryBySlug(@PathVariable String slug) {
        CategoryDTO category = categoryService.getCategoryBySlug(slug);
        return ApiResponse.<CategoryDTO>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(category)
                .build();
    }
}
