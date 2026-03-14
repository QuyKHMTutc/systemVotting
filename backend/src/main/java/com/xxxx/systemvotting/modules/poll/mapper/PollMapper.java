package com.xxxx.systemvotting.modules.poll.mapper;

import com.xxxx.systemvotting.modules.poll.dto.OptionRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.OptionResponseDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.entity.Option;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.user.mapper.UserMapper;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

import com.xxxx.systemvotting.modules.poll.entity.Tag;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = { UserMapper.class })
public interface PollMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "creator", ignore = true) // Will be mapped in Service
    @Mapping(target = "options", ignore = true) // Custom handling to maintain bidirectional relation
    @Mapping(target = "tags", ignore = true) // Will be mapped in Service
    @Mapping(target = "isAnonymous", source = "anonymous")
    Poll toEntity(PollCreateRequestDTO dto);

    PollResponseDTO toDto(Poll entity);

    @AfterMapping
    default void maskAnonymous(Poll poll, @MappingTarget PollResponseDTO dto) {
        if (poll != null && poll.isAnonymous() && dto.getCreator() != null) {
            dto.getCreator().setUsername("Anonymous");
            dto.getCreator().setAvatarUrl(null);
        }
    }

    List<PollResponseDTO> toDtoList(List<Poll> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "voteCount", ignore = true)
    @Mapping(target = "poll", ignore = true)
    Option toOptionEntity(OptionRequestDTO dto);

    OptionResponseDTO toOptionDto(Option entity);

    List<OptionResponseDTO> toOptionDtoList(List<Option> entities);

    default List<String> mapTagsToStrings(Set<Tag> tags) {
        if (tags == null) {
            return java.util.Collections.emptyList();
        }
        return tags.stream()
                .map(Tag::getName)
                .collect(Collectors.toList());
    }
}
