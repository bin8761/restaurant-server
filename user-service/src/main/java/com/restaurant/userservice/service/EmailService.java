package com.restaurant.userservice.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    @Value("${app.mail.fail-on-error:true}")
    private boolean failOnMailError;

    public void sendOtpEmail(String toEmail, String fullName, String otp) {
        if (mailUsername == null || mailUsername.isBlank()) {
            String message = "MAIL_USERNAME dang trong. Chua cau hinh SMTP nen khong the gui OTP email.";
            log.warn(message);
            handleMailFailure(message, otp, new IllegalStateException(message));
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailUsername, "Nha Hang");
            helper.setTo(toEmail);
            helper.setSubject("Ma xac thuc tai khoan cua ban");
            helper.setText(buildOtpEmailHtml(fullName, otp), true);

            mailSender.send(message);
            log.info("OTP email sent to {}", toEmail);
        } catch (MailAuthenticationException e) {
            log.error("SMTP authentication failed when sending OTP to {}: {}", toEmail, e.getMessage());
            handleMailFailure("Khong the xac thuc SMTP de gui OTP. Vui long kiem tra Gmail va App Password.", otp, e);
        } catch (MailException e) {
            log.error("Mail transport error when sending OTP to {}: {}", toEmail, e.getMessage());
            handleMailFailure(resolveMailTransportMessage(e), otp, e);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Cannot compose OTP email to {}: {}", toEmail, e.getMessage());
            handleMailFailure("Khong the tao noi dung email OTP. Vui long thu lai.", otp, e);
        }
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

    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        String verifyUrl = baseUrl + "/api/users/verify-email?token=" + token;

        if (mailUsername == null || mailUsername.isBlank()) {
            String message = "MAIL_USERNAME dang trong. Chua cau hinh SMTP nen khong the gui email xac thuc.";
            log.warn(message);
            handleMailFailure(message, verifyUrl, new IllegalStateException(message));
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailUsername, "Nha Hang");
            helper.setTo(toEmail);
            helper.setSubject("Xac thuc tai khoan cua ban");
            helper.setText(buildVerificationEmailHtml(fullName, verifyUrl), true);

            mailSender.send(message);
            log.info("Verification email sent to {}", toEmail);
        } catch (MailAuthenticationException e) {
            log.error("SMTP authentication failed when sending verification mail to {}: {}", toEmail, e.getMessage());
            handleMailFailure("Khong the xac thuc SMTP de gui email xac thuc. Vui long kiem tra cau hinh mail.", verifyUrl, e);
        } catch (MailException e) {
            log.error("Mail transport error when sending verification mail to {}: {}", toEmail, e.getMessage());
            handleMailFailure(resolveMailTransportMessage(e), verifyUrl, e);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Cannot compose verification email to {}: {}", toEmail, e.getMessage());
            handleMailFailure("Khong the tao noi dung email xac thuc. Vui long thu lai.", verifyUrl, e);
        }
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
