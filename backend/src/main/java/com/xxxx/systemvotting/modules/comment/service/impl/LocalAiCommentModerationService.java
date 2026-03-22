package com.xxxx.systemvotting.modules.comment.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxxx.systemvotting.modules.comment.service.CommentModerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocalAiCommentModerationService implements CommentModerationService {

    private final ObjectMapper objectMapper;

    @Value("${app.moderation.comment.enabled:true}")
    private boolean enabled;

    @Value("${app.moderation.comment.python-bin:python3}")
    private String pythonBin;

    @Value("${app.moderation.comment.predict-script:../ai/predict.py}")
    private String predictScript;

    @Value("${app.moderation.comment.model-path:../ai/models/comment_moderation.joblib}")
    private String modelPath;

    @Value("${app.moderation.comment.timeout-seconds:10}")
    private long timeoutSeconds;

    @Override
    public ModerationResult moderate(String text) {
        if (!enabled || text == null || text.isBlank()) {
            return ModerationResult.unavailable();
        }

        try {
            Path script = Path.of(predictScript).normalize();
            Path model = Path.of(modelPath).normalize();

            if (!Files.exists(script) || !Files.exists(model)) {
                log.warn("Comment moderation artifacts missing. scriptExists={}, modelExists={}", Files.exists(script), Files.exists(model));
                return ModerationResult.unavailable();
            }

            List<String> command = new ArrayList<>();
            command.add(pythonBin);
            command.add(script.toString());
            command.add("--model");
            command.add(model.toString());
            command.add("--text");
            command.add(text);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                log.warn("Comment moderation timed out after {} seconds", timeoutSeconds);
                return ModerationResult.unavailable();
            }

            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            if (process.exitValue() != 0 || output.isBlank()) {
                log.warn("Comment moderation process failed with code {} and output: {}", process.exitValue(), output);
                return ModerationResult.unavailable();
            }

            JsonNode root = objectMapper.readTree(output);
            String label = root.path("label").asText("unknown").toLowerCase(Locale.ROOT);
            JsonNode scores = root.path("scores");
            double confidence = scores.path(label).asDouble(0.0);
            boolean blocked = "spam".equals(label) || "toxic".equals(label);
            String reason = switch (label) {
                case "spam" -> "Comment was flagged as spam by the local moderation model";
                case "toxic" -> "Comment was flagged as toxic by the local moderation model";
                case "off_topic" -> "Comment appears off topic";
                case "normal" -> "Comment passed moderation";
                default -> "Unknown moderation label";
            };

            return new ModerationResult(label, blocked, reason, confidence, true);
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("Comment moderation failed", e);
            return ModerationResult.unavailable();
        }
    }
}
