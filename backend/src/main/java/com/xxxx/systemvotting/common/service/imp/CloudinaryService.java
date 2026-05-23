package com.xxxx.systemvotting.common.service.imp;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Service tích hợp Cloudinary — upload & delete ảnh đám mây.
 *
 * Ảnh Poll được lưu vào folder "polls" trên Cloudinary, với tối ưu hóa tự động:
 *   - Auto format (WebP/AVIF tuỳ browser)
 *   - Auto quality (Cloudinary tự nén thông minh)
 *   - Eager transformation: thumbnail 800×450 (16:9) cho card preview
 */
@Slf4j
@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    private static final String[] ALLOWED_CONTENT_TYPES = {
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    };

    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}")    String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key",    apiKey,
                "api_secret", apiSecret,
                "secure",     true   // luôn dùng HTTPS
        ));
    }

    /**
     * Upload ảnh lên Cloudinary vào folder "polls".
     *
     * @param file        File ảnh từ MultipartFile (max 5MB, JPG/PNG/GIF/WebP)
     * @param publicIdPrefix  Tiền tố để đặt tên file (ví dụ: "poll" → "polls/poll_uuid")
     * @return URL HTTPS của ảnh đã upload (tối ưu tự động bởi Cloudinary)
     */
    @SuppressWarnings("unchecked")
    public String uploadPollImage(MultipartFile file, String publicIdPrefix) throws IOException {
        validateImageFile(file);

        Map<String, Object> uploadOptions = ObjectUtils.asMap(
                "folder",           "polls",
                "public_id",        publicIdPrefix + "_" + java.util.UUID.randomUUID().toString().replace("-", ""),
                "overwrite",        false,
                "resource_type",    "image",
                "transformation",   new com.cloudinary.Transformation().crop("limit").width(1920).height(1080).quality("auto").fetchFormat("auto"),
                "eager",            java.util.Collections.singletonList(
                        new com.cloudinary.Transformation().crop("fill").width(800).height(450).quality("auto").fetchFormat("auto")
                )
        );

        Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), uploadOptions);

        String url = (String) result.get("secure_url");
        log.info("[Cloudinary] Upload thành công: {}", url);
        return url;
    }

    /**
     * Upload ảnh avatar lên Cloudinary vào folder "avatars".
     * Tự động crop vuông và focus vào khuôn mặt (g_face).
     *
     * @param file        File ảnh
     * @param userId      ID người dùng (dùng làm public_id)
     * @return URL HTTPS của avatar
     */
    @SuppressWarnings("unchecked")
    public String uploadAvatarImage(MultipartFile file, Long userId) throws IOException {
        validateImageFile(file);

        Map<String, Object> uploadOptions = ObjectUtils.asMap(
                "folder",           "avatars",
                "public_id",        "user_" + userId + "_" + java.util.UUID.randomUUID().toString().substring(0, 8),
                "overwrite",        false,
                "resource_type",    "image",
                "transformation",   new com.cloudinary.Transformation().width(256).height(256).crop("thumb").gravity("face").quality("auto").fetchFormat("auto")
        );

        Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), uploadOptions);

        String url = (String) result.get("secure_url");
        log.info("[Cloudinary] Upload Avatar thành công: {}", url);
        return url;
    }

    /**
     * Xóa ảnh khỏi Cloudinary theo public_id.
     * Được gọi khi AI phát hiện nội dung DANGEROUS để dọn sạch ảnh đã upload.
     *
     * @param imageUrl URL đầy đủ của ảnh trên Cloudinary
     */
    @SuppressWarnings("unchecked")
    public void deletePollImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        try {
            String publicId = extractPublicIdFromUrl(imageUrl);
            if (publicId != null) {
                Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                log.info("[Cloudinary] Xóa ảnh '{}': {}", publicId, result.get("result"));
            }
        } catch (Exception e) {
            log.warn("[Cloudinary] Không thể xóa ảnh {}: {}", imageUrl, e.getMessage());
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Trích xuất public_id từ URL Cloudinary.
     * URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
     */
    private String extractPublicIdFromUrl(String url) {
        try {
            // Lấy phần sau "/upload/"
            int uploadIdx = url.indexOf("/upload/");
            if (uploadIdx < 0) return null;
            String path = url.substring(uploadIdx + 8); // bỏ "/upload/"

            // Bỏ version prefix (v1234567890/)
            if (path.startsWith("v") && path.indexOf('/') > 0) {
                path = path.substring(path.indexOf('/') + 1);
            }

            // Bỏ phần extension
            int dotIdx = path.lastIndexOf('.');
            if (dotIdx > 0) {
                path = path.substring(0, dotIdx);
            }
            return path; // Ví dụ: "polls/poll_abc123"
        } catch (Exception e) {
            log.warn("[Cloudinary] Không thể phân tích URL để xóa: {}", url);
            return null;
        }
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File ảnh không được để trống.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File ảnh vượt quá kích thước tối đa 5MB.");
        }
        String contentType = file.getContentType();
        boolean isAllowed = false;
        if (contentType != null) {
            for (String allowed : ALLOWED_CONTENT_TYPES) {
                if (allowed.equalsIgnoreCase(contentType)) {
                    isAllowed = true;
                    break;
                }
            }
        }
        if (!isAllowed) {
            throw new IllegalArgumentException("Chỉ chấp nhận ảnh định dạng JPG, PNG, GIF hoặc WebP.");
        }
    }
}
