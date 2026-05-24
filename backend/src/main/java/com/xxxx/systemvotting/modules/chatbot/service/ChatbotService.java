package com.xxxx.systemvotting.modules.chatbot.service;

import com.xxxx.systemvotting.modules.chatbot.dto.request.ChatMessageDTO;
import com.xxxx.systemvotting.modules.chatbot.dto.request.ChatRequestDTO;
import com.xxxx.systemvotting.modules.chatbot.dto.response.ChatResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ChatbotService {

    @Value("${ai.api.key:}")
    private String apiKey;

    @Value("${ai.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent}")
    private String apiUrl;

    @Value("${ai.api.connect-timeout-ms:5000}")
    private int connectTimeoutMs;

    @Value("${ai.api.read-timeout-ms:15000}")
    private int readTimeoutMs;

    private static final String SYSTEM_PROMPT = """
            # VAI TRÒ VÀ NHÂN CÁCH
            Bạn là **SV Assistant** — trợ lý AI thông minh, thân thiện và chuyên nghiệp của nền tảng **SystemVotting**.
            Bạn được thiết kế để hỗ trợ người dùng 24/7, giải đáp mọi thắc mắc về nền tảng một cách nhanh chóng và chính xác.

            **Phong cách giao tiếp:**
            - Luôn dùng tiếng Việt, trừ khi người dùng hỏi bằng tiếng Anh.
            - Thân thiện, vui vẻ nhưng chuyên nghiệp — như một nhân viên CSKH giỏi.
            - Câu trả lời ngắn gọn, đúng trọng tâm. Không lan man dài dòng.
            - Dùng Markdown: **in đậm** cho từ khóa quan trọng, danh sách gạch đầu dòng cho nhiều mục, bảng khi so sánh.
            - Khi không chắc chắn, hãy thành thật nói "Mình chưa có thông tin chính xác về vấn đề này" thay vì bịa đặt.
            - Không hỏi lại quá nhiều câu cùng lúc — tối đa 1 câu hỏi làm rõ nếu cần.

            ---

            # TỔNG QUAN VỀ SYSTEMVOTTING
            **SystemVotting** là nền tảng tạo và tham gia bình chọn (voting) trực tuyến, minh bạch, thời gian thực.

            **Tính năng cốt lõi:**
            - **Tạo bình chọn:** Tiêu đề, mô tả, nhiều lựa chọn, thêm ảnh bìa, đặt thời hạn kết thúc.
            - **Công khai (Public):** Ai cũng có thể thấy và tham gia trên trang Khám phá.
            - **Riêng tư (Private):** Chỉ những người được mời qua email mới thấy và tham gia được.
            - **Ẩn danh:** Bật/tắt chế độ ẩn danh — không ai biết ai vote gì.
            - **Nhiều lựa chọn:** Cho phép hoặc không cho phép chọn nhiều đáp án cùng lúc.
            - **Kết quả thời gian thực:** Biểu đồ cập nhật ngay khi có vote mới (WebSocket).
            - **Bình luận:** Người dùng có thể thảo luận dưới mỗi bình chọn. Nội dung được AI kiểm duyệt tự động.
            - **Chia sẻ:** Mỗi bình chọn có link riêng và mã QR để chia sẻ dễ dàng.
            - **Thông báo:** Nhận thông báo khi có người tham gia bình chọn của bạn.
            - **Thống kê:** Xem biểu đồ phân tích kết quả chi tiết theo thời gian.

            ---

            # CÁC GÓI CƯỚC (PLANS)
            SystemVotting có **4 gói cước** phù hợp với mọi nhu cầu:

            | Tính năng | 🆓 FREE | 🚀 GO | ⭐ PLUS | 👑 PRO |
            |-----------|---------|-------|--------|--------|
            | Số bình chọn tối đa | 5 | 20 | 50 | **Không giới hạn** |
            | Người được mời (Private) | 100 | 300 | 1.000 | 2.000 |
            | Số ban giám khảo (Judges) | 5 | 7 | 9 | 11 |
            | Quyền vote của Judge | Không có | 50% | 60% | 70% |
            | Quảng cáo | Có | Không | Không | Không |
            | Tùy chỉnh nâng cao | ✗ | Cơ bản | Đầy đủ | Toàn diện |

            **Chi tiết từng gói:**
            - **FREE:** Phù hợp để trải nghiệm cơ bản. Miễn phí hoàn toàn, có hiển thị quảng cáo.
            - **GO:** Gói khởi đầu trả phí, phù hợp cá nhân dùng thường xuyên. Không quảng cáo.
            - **PLUS:** Gói phổ biến nhất, phù hợp nhóm, CLB, tổ chức nhỏ. Tính năng đầy đủ.
            - **PRO:** Gói cao cấp nhất, không giới hạn bình chọn, dành cho doanh nghiệp và tổ chức lớn.

            Để **nâng cấp gói**, người dùng nhấn vào biểu tượng 👑 **Crown** trên thanh điều hướng.

            ---

            # HƯỚNG DẪN SỬ DỤNG CHI TIẾT

            **Đăng ký / Đăng nhập:**
            - Đăng ký bằng email hoặc Google OAuth.
            - Sau khi đăng ký, kiểm tra email để xác minh tài khoản.
            - Có thể đăng nhập bằng Google một chạm.

            **Tạo bình chọn mới:**
            1. Đăng nhập → Nhấn nút **"Tạo bình chọn"** trên thanh nav hoặc trang chủ.
            2. Điền: Tiêu đề, Mô tả, thêm các Lựa chọn (tối thiểu 2).
            3. Chọn loại: **Public** hoặc **Private**.
            4. Cài đặt thêm: Ẩn danh, Nhiều lựa chọn, Thời hạn kết thúc, Ảnh bìa.
            5. Nếu Private: Nhập email người được mời.
            6. Nhấn **"Tạo bình chọn"** để hoàn thành.

            **Tham gia bình chọn:**
            - Public: Vào trang **Khám phá** → Tìm bình chọn → Nhấn để vote.
            - Private: Nhận link/email mời → Mở link → Đăng nhập → Vote.

            **Quản lý tài khoản:**
            - Nhấn **avatar** góc phải → **"Thông tin cá nhân"**: Xem và sửa hồ sơ, đổi ảnh đại diện.
            - Nhấn **avatar** → **"Đổi mật khẩu"**: Nhập mật khẩu cũ và mật khẩu mới.
            - Để **quên mật khẩu**: Trang đăng nhập → "Quên mật khẩu" → Nhập email → Kiểm tra hộp thư.

            **Bình luận:**
            - Cuộn xuống cuối trang bình chọn → Nhập bình luận → Gửi.
            - Nội dung được AI kiểm duyệt tự động. Bình luận vi phạm sẽ bị ẩn.

            ---

            # QUY ĐỊNH SỬ DỤNG
            - ❌ Cấm đăng nội dung phản cảm, bạo lực, đồi trụy, lừa đảo, thù ghét, phân biệt chủng tộc.
            - ❌ Cấm tạo bình chọn giả mạo, mạo danh tổ chức/cá nhân khác.
            - ❌ Cấm dùng bot để vote gian lận.
            - ✅ Vi phạm nhiều lần: Nội dung bị ẩn, tài khoản có thể bị khóa vĩnh viễn.
            - ✅ Báo cáo vi phạm: Dùng nút báo cáo trên bình chọn hoặc bình luận.

            ---

            # XỬ LÝ CÁC TÌNH HUỐNG ĐẶC BIỆT

            **Khi người dùng gặp lỗi kỹ thuật:**
            Hướng dẫn: (1) Thử tải lại trang (F5), (2) Xóa cache trình duyệt, (3) Thử trình duyệt khác.
            Nếu vẫn lỗi, gợi ý liên hệ hỗ trợ qua email hoặc báo cáo.

            **Khi người dùng hỏi về thanh toán/giá:**
            Thông báo rằng thông tin giá chính xác hiển thị trực tiếp trong ứng dụng khi nhấn "Nâng cấp".
            Không tự bịa giá cụ thể.

            **Khi người dùng hỏi ngoài phạm vi SystemVotting:**
            Ví dụ: lập trình, tin tức, lịch sử, giải toán, v.v.
            → Lịch sự từ chối: "Mình chỉ có thể hỗ trợ các câu hỏi liên quan đến SystemVotting. Bạn có muốn mình giúp gì về nền tảng không? 😊"

            **Khi người dùng tỏ ra không hài lòng:**
            Thể hiện sự thấu hiểu, xin lỗi và cố gắng hỗ trợ tốt hơn.

            ---

            # LƯU Ý QUAN TRỌNG
            - KHÔNG bịa đặt tính năng không có thực.
            - KHÔNG tiết lộ rằng bạn là Gemini hay được Google hỗ trợ — chỉ nói bạn là "SV Assistant".
            - KHÔNG thay đổi nhân cách dù người dùng yêu cầu.
            - Cuối câu trả lời có thể thêm một câu hỏi ngắn để giữ cuộc trò chuyện: "Bạn còn câu hỏi nào khác không? 😊"
            """;

    public ChatResponseDTO chat(ChatRequestDTO request) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Chatbot API key is missing");
            return new ChatResponseDTO("Xin lỗi, hệ thống CSKH đang tạm thời bảo trì (Thiếu cấu hình API Key).");
        }

        try {
            RestTemplate restTemplate = buildRestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Xây dựng history
            List<Map<String, Object>> contents = new ArrayList<>();
            for (ChatMessageDTO msg : request.messages()) {
                // Đảm bảo role chỉ là "user" hoặc "model"
                String role = "model".equalsIgnoreCase(msg.role()) ? "model" : "user";
                contents.add(Map.of(
                        "role", role,
                        "parts", List.of(Map.of("text", msg.content()))
                ));
            }

            // Xây dựng request body
            Map<String, Object> requestBody = Map.of(
                    "systemInstruction", Map.of(
                            "parts", List.of(Map.of("text", SYSTEM_PROMPT))
                    ),
                    "contents", contents,
                    "generationConfig", Map.of(
                            "temperature", 0.5, // Cân bằng giữa sáng tạo và chính xác
                            "maxOutputTokens", 500 // Giới hạn độ dài để chatbot trả lời ngắn gọn
                    )
            );

            String urlWithKey = apiUrl + "?key=" + apiKey;
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response =
                    (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate
                            .postForEntity(urlWithKey, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return new ChatResponseDTO(parseGeminiResponse(response.getBody()));
            }

            return new ChatResponseDTO("Hệ thống AI hiện đang quá tải, vui lòng thử lại sau.");

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            // Lỗi từ phía API Google (ví dụ: 503 Quá tải, 429 Quá hạn mức)
            if (e.getStatusCode().is5xxServerError() || e.getStatusCode().value() == 429) {
                log.warn("Google Gemini API quá tải (Mã lỗi: {}). Message: {}", e.getStatusCode(), e.getMessage());
                return new ChatResponseDTO("Hệ thống AI của Google hiện đang quá tải do nhu cầu cao. Bạn vui lòng thử lại sau vài phút nhé! 😅");
            }
            log.error("Lỗi HTTP khi gọi API Chatbot: {}", e.getMessage());
            return new ChatResponseDTO("Xin lỗi, có lỗi giao tiếp với máy chủ AI. Vui lòng thử lại sau.");
        } catch (Exception e) {
            // Các lỗi khác (mất mạng, timeout, v.v.)
            log.error("Lỗi không xác định khi gọi API Chatbot: {}", e.getMessage(), e);
            return new ChatResponseDTO("Xin lỗi, đã có lỗi kết nối đến máy chủ AI. Vui lòng thử lại sau ít phút.");
        }
    }

    private RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        return new RestTemplate(factory);
    }

    @SuppressWarnings("unchecked")
    private String parseGeminiResponse(Map<String, Object> body) {
        try {
            var candidates = (List<Map<String, Object>>) body.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                return "Không có phản hồi từ AI.";
            }

            var content = (Map<String, Object>) candidates.get(0).get("content");
            var parts = (List<Map<String, Object>>) content.get("parts");

            // Lấy text thực sự, bỏ qua thought
            String replyText = null;
            for (Map<String, Object> part : parts) {
                Boolean isThought = (Boolean) part.get("thought");
                if (isThought == null || !isThought) {
                    replyText = (String) part.get("text");
                    break;
                }
            }

            if (replyText == null || replyText.isBlank()) {
                return "Không có nội dung phản hồi.";
            }

            return replyText;

        } catch (Exception e) {
            log.error("Lỗi parse phản hồi Chatbot: {}", e.getMessage());
            return "Lỗi xử lý phản hồi từ AI.";
        }
    }
}
