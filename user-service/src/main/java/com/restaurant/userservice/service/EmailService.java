package com.restaurant.userservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final String SENDGRID_SEND_EMAIL_PATH = "/v3/mail/send";

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    @Value("${app.mail.fail-on-error:true}")
    private boolean failOnMailError;

    @Value("${app.mail.sendgrid.api-key:${SENDGRID_API_KEY:}}")
    private String sendGridApiKey;

    @Value("${app.mail.sendgrid.base-url:${SENDGRID_API_BASE_URL:https://api.sendgrid.com}}")
    private String sendGridBaseUrl;

    @Value("${app.mail.sendgrid.from:${SENDGRID_FROM:}}")
    private String sendGridFrom;

    @Value("${app.mail.sendgrid.from-name:${SENDGRID_FROM_NAME:Nha Hang}}")
    private String sendGridFromName;

    @Value("${app.mail.sendgrid.connect-timeout-ms:${SENDGRID_CONNECT_TIMEOUT_MS:5000}}")
    private int sendGridConnectTimeoutMs;

    @Value("${app.mail.sendgrid.read-timeout-ms:${SENDGRID_READ_TIMEOUT_MS:10000}}")
    private int sendGridReadTimeoutMs;

    public void sendOtpEmail(String toEmail, String fullName, String otp) {
        String subject = "Ma xac thuc tai khoan cua ban";
        String html = buildOtpEmailHtml(fullName, otp);
        sendHtmlEmail(toEmail, subject, html, otp,
                "Khong the gui email OTP luc nay. Vui long thu lai sau it phut.");
    }

    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        String verifyUrl = baseUrl + "/api/users/verify-email?token=" + token;
        String subject = "Xac thuc tai khoan cua ban";
        String html = buildVerificationEmailHtml(fullName, verifyUrl);
        sendHtmlEmail(toEmail, subject, html, verifyUrl,
                "Khong the gui email xac thuc luc nay. Vui long thu lai sau.");
    }

    private void sendHtmlEmail(String toEmail,
                               String subject,
                               String html,
                               String fallbackValue,
                               String genericFailureMessage) {
        if (hasSendGridApiKey()) {
            sendViaSendGridApi(toEmail, subject, html, fallbackValue, genericFailureMessage);
            return;
        }

        sendViaSmtp(toEmail, subject, html, fallbackValue);
    }

    private void sendViaSendGridApi(String toEmail,
                                    String subject,
                                    String html,
                                    String fallbackValue,
                                    String genericFailureMessage) {
        if (sendGridFrom == null || sendGridFrom.isBlank()) {
            String message = "SENDGRID_FROM dang trong. Chua cau hinh du thong tin gui mail qua SendGrid API.";
            log.warn(message);
            handleMailFailure(message, fallbackValue, new IllegalStateException(message));
            return;
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(Math.max(1000, sendGridConnectTimeoutMs)))
                    .build();

            Map<String, Object> payload = new LinkedHashMap<>();
            List<Map<String, Object>> personalizations = new ArrayList<>();
            personalizations.add(Map.of("to", List.of(Map.of("email", toEmail))));
            payload.put("personalizations", personalizations);

            Map<String, Object> from = new LinkedHashMap<>();
            from.put("email", sendGridFrom.trim());
            if (sendGridFromName != null && !sendGridFromName.isBlank()) {
                from.put("name", sendGridFromName.trim());
            }
            payload.put("from", from);
            payload.put("subject", subject);
            payload.put("content", List.of(Map.of("type", "text/html", "value", html)));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(normalizeSendGridBaseUrl() + SENDGRID_SEND_EMAIL_PATH))
                    .timeout(Duration.ofMillis(Math.max(1000, sendGridReadTimeoutMs)))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + sendGridApiKey.trim())
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status < 200 || status >= 300) {
                String msg = "SendGrid API tra ve status " + status + ". Body=" + truncate(response.body(), 400);
                log.error("{}", msg);
                handleMailFailure("Khong the gui email OTP qua SendGrid luc nay. Vui long thu lai sau it phut.",
                        fallbackValue,
                        new RuntimeException(msg));
                return;
            }

            log.info("Email sent via SendGrid API to {}", toEmail);
        } catch (Exception e) {
            log.error("SendGrid API send failed to {}: {}", toEmail, e.getMessage());
            handleMailFailure(genericFailureMessage, fallbackValue, e);
        }
    }

    private void sendViaSmtp(String toEmail,
                             String subject,
                             String html,
                             String fallbackValue) {
        if (mailUsername == null || mailUsername.isBlank()) {
            String message = "MAIL_USERNAME dang trong. Chua cau hinh SMTP nen khong the gui email.";
            log.warn(message);
            handleMailFailure(message, fallbackValue, new IllegalStateException(message));
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailUsername, "Nha Hang");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Email sent via SMTP to {}", toEmail);
        } catch (MailAuthenticationException e) {
            log.error("SMTP authentication failed when sending email to {}: {}", toEmail, e.getMessage());
            handleMailFailure("Khong the xac thuc SMTP de gui email. Vui long kiem tra SMTP username/password.",
                    fallbackValue,
                    e);
        } catch (MailException e) {
            log.error("Mail transport error when sending email to {}: {}", toEmail, e.getMessage());
            handleMailFailure(resolveMailTransportMessage(e), fallbackValue, e);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Cannot compose email to {}: {}", toEmail, e.getMessage());
            handleMailFailure("Khong the tao noi dung email. Vui long thu lai.", fallbackValue, e);
        }
    }

    private boolean hasSendGridApiKey() {
        return sendGridApiKey != null && !sendGridApiKey.isBlank();
    }

    private String normalizeSendGridBaseUrl() {
        String value = sendGridBaseUrl == null || sendGridBaseUrl.isBlank()
                ? "https://api.sendgrid.com"
                : sendGridBaseUrl.trim();
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private void handleMailFailure(String userMessage, String fallbackValue, Exception e) {
        if (!failOnMailError) {
            log.warn("Mail send failed but failOnMailError=false, fallback value: {}", fallbackValue);
            return;
        }
        throw new RuntimeException(userMessage, e);
    }

    private String resolveMailTransportMessage(MailException e) {
        String message = e.getMessage() == null ? "" : e.getMessage().toLowerCase();
        Throwable rootCause = e;
        while (rootCause.getCause() != null) {
            rootCause = rootCause.getCause();
        }
        String rootMessage = rootCause.getMessage() == null ? "" : rootCause.getMessage().toLowerCase();
        String combined = (message + " " + rootMessage).trim();

        if (combined.contains("timed out") || combined.contains("timeout")) {
            return "Ket noi SMTP bi timeout. Vui long kiem tra MAIL_HOST/MAIL_PORT hoac thu lai sau.";
        }
        if (combined.contains("could not connect") || combined.contains("connection refused") || combined.contains("unknownhost")) {
            return "Khong ket noi duoc SMTP server. Vui long kiem tra MAIL_HOST/MAIL_PORT.";
        }
        return "Khong the gui email OTP luc nay. Vui long thu lai sau it phut.";
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength) + "...";
    }

    private String buildOtpEmailHtml(String fullName, String otp) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                  <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 32px; text-align: center;">
                    <h2 style="color: #c0392b;">Xac thuc tai khoan</h2>
                    <p>Xin chao <strong>%s</strong>,</p>
                    <p>Ma xac thuc cua ban la:</p>
                    <div style="background: #f9f9f9; border: 2px dashed #c0392b; border-radius: 8px; padding: 24px; margin: 24px 0;">
                      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #c0392b;">%s</span>
                    </div>
                    <p style="color: #888; font-size: 14px;">
                      Ma nay co hieu luc trong <strong>10 phut</strong>. Vui long khong chia se ma nay voi bat ky ai.
                    </p>
                    <p style="color: #888; font-size: 12px;">Neu ban khong yeu cau, hay bo qua email nay.</p>
                  </div>
                </body>
                </html>
                """.formatted(fullName, otp);
    }

    private String buildVerificationEmailHtml(String fullName, String verifyUrl) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                  <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 32px;">
                    <h2 style="color: #c0392b;">Xac thuc tai khoan</h2>
                    <p>Xin chao <strong>%s</strong>,</p>
                    <p>Cam on ban da dang ky tai khoan tai nha hang cua chung toi.</p>
                    <p>Vui long bam vao nut ben duoi de xac thuc email cua ban:</p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="%s"
                         style="background: #c0392b; color: white; padding: 14px 28px;
                                text-decoration: none; border-radius: 6px; font-size: 16px;">
                        Xac thuc Email
                      </a>
                    </div>
                    <p style="color: #888; font-size: 13px;">
                      Link co hieu luc trong 24 gio. Neu ban khong yeu cau, hay bo qua email nay.
                    </p>
                    <p style="color: #888; font-size: 12px;">Hoac copy link: %s</p>
                  </div>
                </body>
                </html>
                """.formatted(fullName, verifyUrl, verifyUrl);
    }
}
