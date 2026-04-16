package com.xxxx.systemvotting.common.service.imp;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender emailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Value("${sendgrid.api.key:}")
    private String sendGridApiKey;

    public void sendSimpleMessage(String to, String subject, String text) {
        if (sendGridApiKey != null && !sendGridApiKey.isBlank()) {
            sendWithSendGrid(to, subject, text);
        } else {
            sendWithSmtp(to, subject, text);
        }
    }

    private void sendWithSendGrid(String to, String subject, String text) {
        try {
            String fromAddress = (senderEmail == null || senderEmail.isBlank())
                    ? "no-reply@systemvotting.com"
                    : senderEmail;

            Email from = new Email(fromAddress);
            Email toEmail = new Email(to);
            Content content = new Content("text/plain", text);
            Mail mail = new Mail(from, subject, toEmail, content);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            var response = sg.api(request);
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("SendGrid email sent successfully to: {}", to);
            } else {
                log.error("SendGrid email failed for {}. Status: {}, Body: {}",
                        to, response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("Exception while sending email with SendGrid to {}. Error: {}", to, e.getMessage(), e);
        }
    }

    private void sendWithSmtp(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            emailSender.send(message);
            log.info("SMTP email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email via SMTP to {}. Error: {}", to, e.getMessage(), e);
        }
    }
}
