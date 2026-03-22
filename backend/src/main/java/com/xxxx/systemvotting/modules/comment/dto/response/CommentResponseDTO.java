package com.xxxx.systemvotting.modules.comment.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin phản hồi của bình luận")
public class CommentResponseDTO {
    @Schema(description = "ID của bình luận", example = "1")
    private Long id;

    @Schema(description = "ID của người dùng (null nếu ẩn danh)", example = "1")
    private Long userId;

    @Schema(description = "Tên người dùng hoặc nhãn ẩn danh", example = "tranquy")
    private String username;

    @Schema(description = "Ảnh đại diện (null nếu ẩn danh)", example = "https://example.com/avatar.jpg")
    private String avatarUrl;

    @Schema(description = "Nội dung bình luận", example = "Bài viết rất hay!")
    private String content;

    @Schema(description = "Trạng thái ẩn danh", example = "false")
    @JsonProperty("isAnonymous")
    private boolean isAnonymous;

    @Schema(description = "Thời gian tạo", example = "2024-03-15T10:00:00")
    private LocalDateTime createdAt;
    
    @Schema(description = "Trạng thái vote của người này trong poll", example = "Đã vote: Java")
    private String voteStatus;

    @Schema(description = "ID của bình luận cha (nếu là phản hồi)", example = "null")
    private Long parentId;

    @Schema(description = "Danh sách các phản hồi con")
    private java.util.List<CommentResponseDTO> replies;

    @Schema(description = "Trạng thái kiểm duyệt", example = "APPROVED")
    private String moderationStatus;

    @Schema(description = "Nhãn AI moderation", example = "spam")
    private String moderationLabel;

    @Schema(description = "Độ tin cậy moderation", example = "0.96")
    private Double moderationConfidence;
}
