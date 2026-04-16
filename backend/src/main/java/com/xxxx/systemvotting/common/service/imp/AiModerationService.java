package com.xxxx.systemvotting.common.service.imp;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class AiModerationService {

    @Value("${ai.service.url:http://localhost:8000/check-toxicity}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;

    public AiModerationService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Sends the text content to the local Python AI service to check for toxicity.
     * @param content the text to moderate
     * @return true if the AI classifies it as toxic, false otherwise
     */
    public boolean isToxicContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return false;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            AiRequest request = new AiRequest(content);
            HttpEntity<AiRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<AiResponse> response = restTemplate.postForEntity(
                    aiServiceUrl, entity, AiResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().isToxic();
            } else {
                log.warn("AI Service returned non-success status or empty body: {}", response.getStatusCode());
                // Fallback to false if AI service acts up, or you can throw exception based on strictness
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to connect to AI Moderation Service. Is the Python FastAPI server running on port 8000?", e);
            // Ném ra một lỗi rõ ràng báo hiệu Server AI đang sập, thay vì âm thầm cho phép qua
            throw new com.xxxx.systemvotting.exception.AppException(com.xxxx.systemvotting.exception.ErrorCode.INTERNAL_ERROR);
        }
    }

    @Data
    private static class AiRequest {
        private String content;

        public AiRequest(String content) {
            this.content = content;
        }
    }

    @Data
    private static class AiResponse {
        private String content;
        
        @com.fasterxml.jackson.annotation.JsonProperty("is_toxic")
        private boolean is_toxic;   // Must explicitly annotate for Jackson
        
        private double confidence;

        public boolean isToxic() {
            return is_toxic;
        }
    }
}
