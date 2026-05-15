package com.xxxx.systemvotting.modules.poll.service.impl;

import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.poll.dto.CategoryDTO;
import com.xxxx.systemvotting.modules.poll.entity.Category;
import com.xxxx.systemvotting.modules.poll.repository.CategoryRepository;
import com.xxxx.systemvotting.modules.poll.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "sortOrder"))
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return toDTO(category);
    }

    public CategoryDTO toDTO(Category category) {
        if (category == null) return null;
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .icon(category.getIcon())
                .sortOrder(category.getSortOrder())
                .build();
    }
}
