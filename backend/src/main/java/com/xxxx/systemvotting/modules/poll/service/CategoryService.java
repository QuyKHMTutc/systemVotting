package com.xxxx.systemvotting.modules.poll.service;

import com.xxxx.systemvotting.modules.poll.dto.CategoryDTO;

import java.util.List;

public interface CategoryService {

    /**
     * Returns all categories ordered by sortOrder ascending.
     */
    List<CategoryDTO> getAllCategories();

    /**
     * Finds a category by its slug.
     */
    CategoryDTO getCategoryBySlug(String slug);
}
