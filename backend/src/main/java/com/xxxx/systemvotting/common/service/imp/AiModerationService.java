package com.xxxx.systemvotting.common.service.imp;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

/**
 * AI Moderation Service — calls the Python FastAPI toxicity classifier.
 *
 * Performance improvements:
 * - Connect timeout: 500ms  (fail fast if AI is down)
 * - Read timeout: 1500ms    (AI inference should complete in <1s)
 * - Fallback: returns false (allow content) instead of throwing exception,
 *   preventing thread starvation when AI service is under load or unreachable.
 */
@Slf4j
@Service
public class AiModerationService {

    @Value("${ai.service.url:http://localhost:8000/check-toxicity}")
    private String aiServiceUrl;

    @Value("${ai.service.connect-timeout-ms:500}")
    private int connectTimeoutMs;

    @Value("${ai.service.read-timeout-ms:1500}")
    private int readTimeoutMs;

    private final RestTemplate restTemplate;

    public AiModerationService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(500);   // 500ms — abort quickly if AI is unreachable
        factory.setReadTimeout(1500);     // 1.5s  — AI inference should complete in time
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Sends content to the local Python AI service for toxicity classification.
     *
     * @param content the text to moderate
     * @return true if toxic, false if safe or if AI service is unavailable (fail-open policy)
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
                log.warn("AI Service returned non-success status: {}", response.getStatusCode());
                return false; // Fail-open: allow content if AI responds abnormally
            }

        } catch (ResourceAccessException e) {
            // Timeout or connection refused — log as WARN (not ERROR) since this is a known degraded state
            log.warn("AI Moderation Service unreachable (timeout/refused). Allowing content through. URL: {}", aiServiceUrl);
            return false; // Fail-open: do NOT block all traffic because AI is down

        } catch (Exception e) {
            log.error("Unexpected error calling AI Moderation Service: {}", e.getMessage());
            return false; // Fail-open: keep system running
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
        private boolean is_toxic;

        private double confidence;

        public boolean isToxic() {
            return is_toxic;
        }
    }
}
