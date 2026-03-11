package com.xxxx.systemvotting.modules.poll.mapper;

import com.xxxx.systemvotting.modules.poll.dto.OptionRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.OptionResponseDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.entity.Option;
import com.xxxx.systemvotting.modules.poll.entity.Poll;
import com.xxxx.systemvotting.modules.user.mapper.UserMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = { UserMapper.class })
public interface PollMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "creator", ignore = true) // Will be mapped in Service
    @Mapping(target = "options", ignore = true) // Custom handling to maintain bidirectional relation
    Poll toEntity(PollCreateRequestDTO dto);

    PollResponseDTO toDto(Poll entity);

    List<PollResponseDTO> toDtoList(List<Poll> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "voteCount", ignore = true)
    @Mapping(target = "poll", ignore = true)
    Option toOptionEntity(OptionRequestDTO dto);

    OptionResponseDTO toOptionDto(Option entity);

    List<OptionResponseDTO> toOptionDtoList(List<Option> entities);
}
