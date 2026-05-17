package com.xxxx.systemvotting.modules.poll.service.impl;

import com.xxxx.systemvotting.exception.AppException;
import com.xxxx.systemvotting.exception.ErrorCode;
import com.xxxx.systemvotting.modules.poll.dto.CategoryDTO;
import com.xxxx.systemvotting.modules.poll.entity.Category;
import com.xxxx.systemvotting.modules.poll.repository.CategoryRepository;
import com.xxxx.systemvotting.modules.poll.repository.PollRepository;
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
    private final PollRepository pollRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        // Fetch poll counts
        java.util.Map<Long, Long> pollCounts = pollRepository.countPollsByCategory().stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "sortOrder"))
                .stream()
                .map(cat -> {
                    CategoryDTO dto = toDTO(cat);
                    dto.setPollCount(pollCounts.getOrDefault(cat.getId(), 0L));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        CategoryDTO dto = toDTO(category);
        
        java.util.Map<Long, Long> pollCounts = pollRepository.countPollsByCategory().stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));
        dto.setPollCount(pollCounts.getOrDefault(category.getId(), 0L));
        return dto;
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

    @Override
    @Transactional
    public CategoryDTO createCategory(CategoryDTO dto) {
        if (dto.getSlug() != null && !dto.getSlug().isEmpty() && categoryRepository.findBySlug(dto.getSlug()).isPresent()) {
            throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
        }
        
        String finalSlug = (dto.getSlug() != null && !dto.getSlug().trim().isEmpty()) 
                ? dto.getSlug().trim() 
                : generateSlug(dto.getName());
                
        // Ensure slug is unique even if generated
        if (categoryRepository.findBySlug(finalSlug).isPresent()) {
            finalSlug = finalSlug + "-" + System.currentTimeMillis();
        }
        
        Category category = Category.builder()
                .name(dto.getName())
                .slug(finalSlug)
                .icon(dto.getIcon() != null && !dto.getIcon().isEmpty() ? dto.getIcon() : "📌")
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .build();
                
        return toDTO(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public CategoryDTO updateCategory(Long id, CategoryDTO dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        if (dto.getSlug() != null && !dto.getSlug().isEmpty() && !category.getSlug().equals(dto.getSlug())) {
            if (categoryRepository.findBySlug(dto.getSlug()).isPresent()) {
                throw new AppException(ErrorCode.DUPLICATE_RESOURCE);
            }
            category.setSlug(dto.getSlug());
        }

        if (dto.getName() != null && !dto.getName().trim().isEmpty()) {
            category.setName(dto.getName());
        }
        if (dto.getIcon() != null) category.setIcon(dto.getIcon());
        if (dto.getSortOrder() != null) category.setSortOrder(dto.getSortOrder());

        return toDTO(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        List<com.xxxx.systemvotting.modules.poll.entity.Poll> polls = pollRepository.findByCategory_Id(id);
        for (com.xxxx.systemvotting.modules.poll.entity.Poll poll : polls) {
            poll.setCategory(null);
        }
        pollRepository.saveAll(polls);

        categoryRepository.delete(category);
    }
    
    private String generateSlug(String name) {
        if (name == null || name.trim().isEmpty()) return "category-" + System.currentTimeMillis();
        String normalized = java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.toLowerCase().replaceAll("[^a-z0-9]", "-").replaceAll("-+", "-").replaceAll("^-|-$", "");
    }
}
