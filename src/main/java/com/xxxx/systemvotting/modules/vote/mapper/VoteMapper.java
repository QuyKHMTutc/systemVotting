package com.xxxx.systemvotting.modules.vote.mapper;

import com.xxxx.systemvotting.modules.vote.dto.request.VoteRequestDTO;
import com.xxxx.systemvotting.modules.vote.dto.response.VoteResponseDTO;
import com.xxxx.systemvotting.modules.vote.entity.Vote;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface VoteMapper {

    @Mapping(target = "user", ignore = true)
    @Mapping(target = "poll", ignore = true)
    @Mapping(target = "option", ignore = true)
    Vote toEntity(VoteRequestDTO dto);

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "poll.id", target = "pollId")
    @Mapping(source = "option.id", target = "optionId")
    VoteResponseDTO toDto(Vote entity);
}
