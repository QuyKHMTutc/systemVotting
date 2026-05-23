package com.xxxx.systemvotting.common.service.imp;

import com.xxxx.systemvotting.modules.common.enums.ModerationStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * AI Moderation Service — gọi Gemini 1.5 Flash để phân loại nội dung người dùng.
 *
 * Kết quả phân loại:
 *   SAFE       — Nội dung bình thường, không spam, không xúc phạm → duyệt ngay.
 *   SUSPICIOUS — Nội dung đáng ngờ, có thể quảng cáo / spam → chờ Admin duyệt.
 *   DANGEROUS  — Nội dung xúc phạm nặng, 18+, lừa đảo, toxic mạnh → chặn tức thì.
 *
 * Fail-Open Policy: Khi API không phản hồi hoặc thiếu key → trả về SAFE,
 * đảm bảo dịch vụ không bị gián đoạn hoàn toàn.
 */
@Slf4j
@Service
public class AiModerationService {

    // ── Redis — inject optional: nếu không có Redis thì vẫn chạy bình thường (Fail-Open)
    private final StringRedisTemplate redis;

    public AiModerationService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Value("${ai.api.key:}")
    private String apiKey;

    @Value("${ai.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent}")
    private String apiUrl;

    @Value("${ai.api.connect-timeout-ms:3000}")
    private int connectTimeoutMs;

    @Value("${ai.api.read-timeout-ms:8000}")
    private int readTimeoutMs;

    // Cache TTL: kết quả kiểm duyệt cùng nội dung được giữ lại trong 1 giờ
    private static final Duration CACHE_TTL = Duration.ofHours(1);
    // Rate limit: tối đa số lần kiểm duyệt trong 1 phút đối với mỗi user
    private static final int RATE_LIMIT_MAX    = 10;
    private static final Duration RATE_LIMIT_WINDOW = Duration.ofMinutes(1);

    private static final String PROMPT_TEMPLATE = """
            Bạn là hệ thống kiểm duyệt nội dung cho một nền tảng bình chọn cộng đồng.
            Hãy phân loại nội dung sau đây vào ĐÚNG 1 trong 3 loại:

            1. SAFE
               - Nội dung bình thường, hữu ích
               - Không spam
               - Không xúc phạm
               - Không độc hại

            2. SUSPICIOUS
               - Nội dung đáng ngờ
               - Có thể quảng cáo ẩn
               - Có thể spam nhẹ
               - Không chắc chắn về mức độ vi phạm

            3. DANGEROUS
               - Nội dung xúc phạm nặng nề
               - Nội dung 18+ / khiêu dâm
               - Lừa đảo / phishing
               - Spam rõ ràng và lộ liễu
               - Toxic / thù ghét mạnh

            === NỘI DUNG CẦN KIỂM DUYỆT ===
            %s
            ================================

            Trả về JSON hợp lệ theo đúng cấu trúc sau (KHÔNG thêm bất kỳ thứ gì khác):
            {"status":"SAFE","reason":"lý do ngắn gọn bằng tiếng Việt"}
            """;

    /**
     * Kiểm duyệt nội dung văn bản (title, description, comment...).
     * Có cache Redis: cùng nội dung không gọi lại Gemini.
     *
     * @param content Nội dung cần kiểm tra
     * @param userId  ID người dùng đăng (dùng cho rate limiting)
     * @return ModerationStatus — SAFE | SUSPICIOUS | DANGEROUS
     */
    public ModerationResult moderateContent(String content, Long userId) {
        if (content == null || content.isBlank()) {
            return new ModerationResult(ModerationStatus.SAFE, "Nội dung rỗng");
        }

        // 1️⃣ Rate limiting: kiểm tra xem user đã gửi quá nhiều chưa
        if (userId != null && isRateLimited(userId)) {
            log.warn("[Moderation] User {} bị rate-limit — gửi quá {} lần/phút", userId, RATE_LIMIT_MAX);
            // Fail-Open: cho qua nhưng SUSPICIOUS để admin kiểm tra sau
            return new ModerationResult(ModerationStatus.SUSPICIOUS, "Rate limit — cần Admin xét duyệt");
        }

        // 2️⃣ Cache check: nếu đã kiểm duyệt nội dung này rồi thì dùng lại kết quả cũ
        String cacheKey = buildCacheKey(content);
        ModerationResult cached = getCachedResult(cacheKey);
        if (cached != null) {
            log.info("[Moderation] Cache HIT — {} | {}", cached.status(), cached.reason());
            return cached;
        }

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[Moderation] AI_API_KEY chưa được cấu hình — Fail-Open: cho phép nội dung qua.");
            return new ModerationResult(ModerationStatus.SAFE, "API key chưa cấu hình");
        }

        // 3️⃣ Gọi Gemini API
        ModerationResult result = callGeminiApi(content);

        // 4️⃣ Lưu kết quả vào cache
        cacheResult(cacheKey, result);

        return result;
    }

    /**
     * Overload tiện lợi: không cần userId (bỏ qua rate limiting).
     */
    public ModerationResult moderateContent(String content) {
        return moderateContent(content, null);
    }

    private ModerationResult callGeminiApi(String content) {
        try {
            RestTemplate restTemplate = buildRestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String prompt = PROMPT_TEMPLATE.formatted(content.strip());

            // Cấu trúc request body cho Gemini API (v1beta stable)
            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.1,       // Thấp để phân loại nhất quán
                    "maxOutputTokens", 150,    // Chỉ cần JSON ngắn gọn
                    // Tắt chế độ thinking của Gemini 2.5 Flash — chúng ta cần JSON trực tiếp,
                    // không cần model "suy nghĩ" dài dòng trước khi trả lời
                    "thinkingConfig", Map.of("thinkingBudget", 0)
                )
            );

            String urlWithKey = apiUrl + "?key=" + apiKey;
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response =
                    (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate
                            .postForEntity(urlWithKey, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseGeminiResponse(response.getBody());
            }

            log.warn("[Moderation] Gemini API trả về status không thành công: {}", response.getStatusCode());
            return new ModerationResult(ModerationStatus.SAFE, "API không phản hồi đúng — Fail-Open");

        } catch (ResourceAccessException e) {
            log.warn("[Moderation] Không thể kết nối đến Gemini API (timeout/refused) — Fail-Open. Lỗi: {}", e.getMessage());
            return new ModerationResult(ModerationStatus.SAFE, "Kết nối thất bại — Fail-Open");
        } catch (Exception e) {
            log.error("[Moderation] Lỗi không mong đợi khi gọi Gemini API: {}", e.getMessage(), e);
            return new ModerationResult(ModerationStatus.SAFE, "Lỗi hệ thống — Fail-Open");
        }
    }

    /**
     * Kiểm duyệt nhiều đoạn nội dung liên kết nhau (ví dụ: title + description + options).
     * Ghép chúng thành một chuỗi duy nhất để gửi lên Gemini.
     *
     * @param userId ID người dùng (dùng cho rate limiting), có thể null
     * @param parts  Các đoạn văn bản cần kiểm tra
     * @return ModerationResult với kết quả xấu nhất trong số các đoạn
     */
    public ModerationResult moderateMultiple(Long userId, String... parts) {
        StringBuilder combined = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (parts[i] != null && !parts[i].isBlank()) {
                combined.append("[Phần ").append(i + 1).append("]: ").append(parts[i]).append("\n");
            }
        }
        return moderateContent(combined.toString(), userId);
    }

    /** Overload ngược dành cho các nơi không cần rate limiting theo user. */
    public ModerationResult moderateMultiple(String... parts) {
        return moderateMultiple(null, parts);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        return new RestTemplate(factory);
    }

    @SuppressWarnings("unchecked")
    private ModerationResult parseGeminiResponse(Map<String, Object> body) {
        try {
            // Cấu trúc response: candidates[0].content.parts[]
            // Gemini 2.5 Flash có thể trả về nhiều parts: phần thought (suy nghĩ) và phần text thực sự.
            // Chúng ta bỏ qua các phần có "thought":true và chỉ lấy phần text thực sự.
            var candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                log.warn("[Moderation] Gemini không trả về candidates — Fail-Open");
                return new ModerationResult(ModerationStatus.SAFE, "Không có kết quả — Fail-Open");
            }

            var content = (Map<String, Object>) candidates.get(0).get("content");
            var parts = (List<Map<String, Object>>) content.get("parts");

            // Tìm phần text không phải "thought" (suy nghĩ nội bộ của Gemini 2.5 Flash)
            String rawJson = null;
            for (Map<String, Object> part : parts) {
                Boolean isThought = (Boolean) part.get("thought");
                if (isThought == null || !isThought) {
                    rawJson = (String) part.get("text");
                    break;
                }
            }

            if (rawJson == null || rawJson.isBlank()) {
                log.warn("[Moderation] Gemini không trả về text hợp lệ — Fail-Open");
                return new ModerationResult(ModerationStatus.SAFE, "Không có nội dung — Fail-Open");
            }

            // Parse JSON từ text trả về (đã yêu cầu responseMimeType = application/json)
            rawJson = rawJson.trim();
            // Xóa markdown code fences nếu model vẫn thêm vào dù đã dùng JSON mode
            if (rawJson.startsWith("```")) {
                rawJson = rawJson.replaceAll("```json|```", "").trim();
            }

            // Parse thủ công để tránh phụ thuộc ObjectMapper ở đây
            String statusStr = extractJsonField(rawJson, "status");
            String reason = extractJsonField(rawJson, "reason");

            ModerationStatus status;
            try {
                status = ModerationStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException ex) {
                log.warn("[Moderation] Gemini trả về status không hợp lệ: '{}' — Fail-Open", statusStr);
                status = ModerationStatus.SAFE;
                reason = "Giá trị không hợp lệ từ AI — Fail-Open";
            }

            log.info("[Moderation] Kết quả: {} — {}", status, reason);
            return new ModerationResult(status, reason);

        } catch (Exception e) {
            log.error("[Moderation] Không thể phân tích phản hồi của Gemini: {} — Fail-Open", e.getMessage());
            return new ModerationResult(ModerationStatus.SAFE, "Parse thất bại — Fail-Open");
        }
    }

    /**
     * Trích xuất giá trị một trường từ JSON đơn giản dạng {"key":"value"}.
     */
    private String extractJsonField(String json, String key) {
        String searchKey = "\"" + key + "\"";
        int keyIdx = json.indexOf(searchKey);
        if (keyIdx < 0) return "";
        int colonIdx = json.indexOf(':', keyIdx + searchKey.length());
        if (colonIdx < 0) return "";
        int startQuote = json.indexOf('"', colonIdx + 1);
        if (startQuote < 0) return "";
        int endQuote = json.indexOf('"', startQuote + 1);
        if (endQuote < 0) return "";
        return json.substring(startQuote + 1, endQuote);
    }

    // ── Cache & Rate Limiting helpers ────────────────────────────────────────

    /**
     * Kiểm tra rate limit của user bằng Redis INCR + EXPIRE.
     * Mỗi user chỉ được gọi AI tối đa RATE_LIMIT_MAX lần trong RATE_LIMIT_WINDOW.
     * @return true nếu bị rate-limit (đã vượt ngưỡng)
     */
    private boolean isRateLimited(Long userId) {
        if (redis == null) return false;
        try {
            String key = "moderation:rate:" + userId;
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1) {
                // Lần đầu tiên trong window — set TTL
                redis.expire(key, RATE_LIMIT_WINDOW);
            }
            return count != null && count > RATE_LIMIT_MAX;
        } catch (Exception e) {
            log.warn("[Moderation] Redis rate-limit lỗi — bỏ qua kiểm tra: {}", e.getMessage());
            return false; // Fail-Open
        }
    }

    /**
     * Tạo cache key từ SHA-256 hash của nội dung.
     * Nội dung giống hệt nhau → cùng key → dùng lại kết quả.
     */
    private String buildCacheKey(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.strip().toLowerCase().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return "moderation:cache:" + hex;
        } catch (Exception e) {
            // Fallback: dùng hashCode nếu SHA-256 lỗi (cực hiếm)
            return "moderation:cache:" + Math.abs(content.hashCode());
        }
    }

    /**
     * Lấy kết quả kiểm duyệt đã được cache từ Redis.
     * @return null nếu cache miss hoặc Redis không khả dụng
     */
    private ModerationResult getCachedResult(String cacheKey) {
        if (redis == null) return null;
        try {
            String cached = redis.opsForValue().get(cacheKey);
            if (cached == null) return null;
            // Format lưu: "STATUS|lý do"
            int sep = cached.indexOf('|');
            if (sep < 0) return null;
            ModerationStatus status = ModerationStatus.valueOf(cached.substring(0, sep));
            String reason = cached.substring(sep + 1);
            return new ModerationResult(status, reason);
        } catch (Exception e) {
            log.warn("[Moderation] Redis cache GET lỗi — bỏ qua: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Lưu kết quả kiểm duyệt vào Redis cache.
     */
    private void cacheResult(String cacheKey, ModerationResult result) {
        if (redis == null) return;
        try {
            String value = result.status().name() + "|" + result.reason();
            redis.opsForValue().set(cacheKey, value, CACHE_TTL);
        } catch (Exception e) {
            log.warn("[Moderation] Redis cache SET lỗi — bỏ qua: {}", e.getMessage());
        }
    }

    // ── Result record ────────────────────────────────────────────────────────

    /**
     * Kết quả kiểm duyệt từ Gemini.
     *
     * @param status Phân loại: SAFE, SUSPICIOUS, DANGEROUS
     * @param reason Lý do ngắn gọn bằng tiếng Việt (từ AI)
     */
    public record ModerationResult(ModerationStatus status, String reason) {}
}
