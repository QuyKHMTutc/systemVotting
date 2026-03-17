package com.xxxx.systemvotting.modules.poll.controller;

import java.util.List;

import com.xxxx.systemvotting.common.dto.ApiResponse;
import com.xxxx.systemvotting.modules.poll.dto.PollCreateRequestDTO;
import com.xxxx.systemvotting.modules.poll.dto.PollResponseDTO;
import com.xxxx.systemvotting.modules.poll.service.PollService;
import com.xxxx.systemvotting.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;

import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Polls", description = "Tạo, xem, xóa bình chọn; danh sách bình chọn của tôi / đã bình chọn")
@RestController
@RequestMapping("/api/v1/polls")
@RequiredArgsConstructor
public class PollController {

    private final PollService pollService;

    @Operation(summary = "Tạo bình chọn", description = "Tạo bình chọn mới (yêu cầu đăng nhập)", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Tạo thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa đăng nhập") })
    @PostMapping
    public ResponseEntity<ApiResponse<PollResponseDTO>> createPoll(
            @Valid @RequestBody PollCreateRequestDTO requestDTO,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        requestDTO.setCreatorId(userDetails.getId());

        PollResponseDTO createdPoll = pollService.createPoll(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Poll created successfully", createdPoll));
    }

    @Operation(summary = "Chi tiết bình chọn", description = "Lấy thông tin một bình chọn theo ID")
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy") })
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PollResponseDTO>> getPoll(@PathVariable("id") Long id) {
        PollResponseDTO poll = pollService.getPollById(id);
        return ResponseEntity.ok(ApiResponse.success(poll));
    }

    @Operation(summary = "Danh sách bình chọn", description = "Lấy danh sách có phân trang, lọc theo title/tag/status, sắp xếp")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PollResponseDTO>>> getAllPolls(
            @RequestParam(name = "title", required = false) String title,
            @RequestParam(name = "tag", required = false, defaultValue = "ALL") String tag,
            @RequestParam(name = "status", required = false, defaultValue = "ALL") String status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(name = "direction", defaultValue = "desc") String direction) {

        Page<PollResponseDTO> polls = pollService.getAllPolls(title, tag, status, page, size, sortBy, direction);
        return ResponseEntity.ok(ApiResponse.success(polls));
    }

    @Operation(summary = "Xóa bình chọn", description = "Chỉ creator hoặc admin mới xóa được", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @ApiResponses({ @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Xóa thành công"), @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền") })
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePoll(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        pollService.deletePoll(id, userDetails);
        return ResponseEntity.ok(ApiResponse.success("Poll deleted successfully", null));
    }

    @Operation(summary = "Bình chọn của tôi", description = "Danh sách bình chọn do user hiện tại tạo", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @GetMapping("/my-polls")
    public ResponseEntity<ApiResponse<java.util.List<PollResponseDTO>>> getMyPolls(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        java.util.List<PollResponseDTO> polls = pollService.getMyPolls(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(polls));
    }

    @Operation(summary = "Đã bình chọn", description = "Danh sách bình chọn mà user đã vote", security = { @SecurityRequirement(name = "Bearer Authentication") })
    @GetMapping("/my-voted")
    public ResponseEntity<ApiResponse<java.util.List<PollResponseDTO>>> getVotedPolls(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        java.util.List<PollResponseDTO> polls = pollService.getVotedPolls(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(polls));
    }
}
