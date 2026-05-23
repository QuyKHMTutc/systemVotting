package com.xxxx.systemvotting.modules.common.enums;

/**
 * Trạng thái kiểm duyệt nội dung, được sử dụng cho cả Poll và Comment.
 *
 * SAFE       — Nội dung sạch, được đăng ngay lập tức.
 * SUSPICIOUS — Nội dung đáng ngờ (có thể quảng cáo, spam mờ), chờ Admin duyệt.
 * DANGEROUS  — Nội dung vi phạm nghiêm trọng (18+, lừa đảo, toxic mạnh), bị chặn tức thì.
 */
public enum ModerationStatus {
    SAFE,
    SUSPICIOUS,
    DANGEROUS
}
