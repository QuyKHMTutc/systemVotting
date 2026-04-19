package com.xxxx.systemvotting.modules.poll.mapper;

import com.xxxx.systemvotting.modules.poll.dto.OptionRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.OptionResponseDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.entity.Option;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.poll.entity.Tag;
import com.xxxx.systemvotting.modules.user.dto.UserResponseDTO;
import com.xxxx.systemvotting.modules.user.mapper.UserMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = { UserMapper.class })
public interface PollMapper {

    @Mapping(target = "id",         ignore = true)
    @Mapping(target = "createdAt",  ignore = true)
    @Mapping(target = "updatedAt",  ignore = true)
    @Mapping(target = "creator",    ignore = true)   // set in service
    @Mapping(target = "options",    ignore = true)   // bidirectional relation, set in service
    @Mapping(target = "tags",       ignore = true)   // set in service
    @Mapping(target = "isAnonymous", source = "isAnonymous")
    Poll toEntity(PollCreateRequestDTO dto);

    /**
     * Maps Poll entity → PollResponseDTO.
     * Anonymous-poll masking and Redis vote enrichment are handled in the service layer.
     */
    PollResponseDTO toDto(Poll entity);

    List<PollResponseDTO> toDtoList(List<Poll> entities);

    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "voteCount", ignore = true)
    @Mapping(target = "poll",      ignore = true)
    Option toOptionEntity(OptionRequestDTO dto);

    OptionResponseDTO toOptionDto(Option entity);

    List<OptionResponseDTO> toOptionDtoList(Set<Option> entities);

    default List<String> mapTagsToStrings(Set<Tag> tags) {
        if (tags == null) return List.of();
        return tags.stream()
                .map(Tag::getName)
                .collect(Collectors.toList());
    }
}
