package com.xxxx.systemvotting.modules.poll.controller;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.common.dto.PageResponse;
import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.service.PollService;
import com.xxxx.systemvotting.modules.user.entity.User;
import com.xxxx.systemvotting.modules.user.enums.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Polls", description = "Tạo, xem, xóa bình chọn; danh sách bình chọn của tôi / đã bình chọn")
@RestController
@RequestMapping("/api/v1/polls")
@RequiredArgsConstructor
@Validated
public class PollController {

    private final PollService pollService;

    @Operation(summary = "Tạo bình chọn", description = "Tạo bình chọn mới (yêu cầu đăng nhập)", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Tạo thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa đăng nhập") })
    @PostMapping
    public ApiResponse<PollResponseDTO> createPoll(
            @Valid @RequestBody PollCreateRequestDTO requestDTO,
            @AuthenticationPrincipal Jwt jwt) {
        // Inject creatorId from JWT — records are immutable, so we rebuild with the additional field
        PollCreateRequestDTO withCreator = new PollCreateRequestDTO(
                requestDTO.title(),
                requestDTO.description(),
                requestDTO.tags(),
                requestDTO.isAnonymous(),
                requestDTO.startTime(),
                requestDTO.endTime(),
                requestDTO.options(),
                Long.valueOf(jwt.getSubject())
        );
        PollResponseDTO createdPoll = pollService.createPoll(withCreator);
        return ApiResponse.<PollResponseDTO>builder()
                .code(HttpStatus.CREATED.value())
                .message("Poll created successfully")
                .data(createdPoll)
                .build();
    }

    @Operation(summary = "Chi tiết bình chọn", description = "Lấy thông tin một bình chọn theo ID")
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy") })
    @GetMapping("/{id}")
    public ApiResponse<PollResponseDTO> getPoll(@PathVariable Long id) {
        PollResponseDTO poll = pollService.getPollById(id);
        return ApiResponse.<PollResponseDTO>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(poll)
                .build();
    }

    @Operation(summary = "Danh sách bình chọn", description = "Lấy danh sách có phân trang, lọc theo title/tag/status, sắp xếp")
    @GetMapping
    public ApiResponse<PageResponse<PollResponseDTO>> getAllPolls(
            @RequestParam(required = false) String title,
            @RequestParam(required = false, defaultValue = "ALL") String tag,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(1000) int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        PageResponse<PollResponseDTO> polls = pollService.getAllPolls(title, tag, status, page, size, sortBy, direction);
        return ApiResponse.<PageResponse<PollResponseDTO>>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(polls)
                .build();
    }

    @Operation(summary = "Xóa bình chọn", description = "Chỉ creator hoặc admin mới xóa được", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Xóa thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền") })
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deletePoll(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        User caller = new User();
        caller.setId(Long.valueOf(jwt.getSubject()));
        caller.setRole(roles != null && roles.contains("ADMIN") ? Role.ADMIN : Role.USER);
        pollService.deletePoll(id, caller);
        return ApiResponse.<Void>builder()
                .code(HttpStatus.OK.value())
                .message("Poll deleted successfully")
                .build();
    }

    @Operation(summary = "Bình chọn của tôi", description = "Danh sách bình chọn do user hiện tại tạo (phân trang, page 0-based)", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @GetMapping("/my-polls")
    public ApiResponse<PageResponse<PollResponseDTO>> getMyPolls(
            @Parameter(description = "Số trang (0-based)") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Kích thước trang") @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @AuthenticationPrincipal Jwt jwt) {
        PageResponse<PollResponseDTO> polls = pollService.getMyPolls(Long.valueOf(jwt.getSubject()), page, size);
        return ApiResponse.<PageResponse<PollResponseDTO>>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(polls)
                .build();
    }

    @Operation(summary = "Đã bình chọn", description = "Danh sách bình chọn mà user đã vote (phân trang, page 0-based)", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @GetMapping("/my-voted")
    public ApiResponse<PageResponse<PollResponseDTO>> getVotedPolls(
            @Parameter(description = "Số trang (0-based)") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Kích thước trang") @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @AuthenticationPrincipal Jwt jwt) {
        PageResponse<PollResponseDTO> polls = pollService.getVotedPolls(Long.valueOf(jwt.getSubject()), page, size);
        return ApiResponse.<PageResponse<PollResponseDTO>>builder()
                .code(HttpStatus.OK.value())
                .message("Success")
                .data(polls)
                .build();
    }
}
