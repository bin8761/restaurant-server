package com.restaurant.userservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

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

    /**
     * Gửi email OTP (6 chữ số) xác thực tài khoản.
     * Nếu mail chưa được cấu hình (username trống), in OTP ra console để test.
     */
    public void sendOtpEmail(String toEmail, String fullName, String otp) {
        if (mailUsername == null || mailUsername.isBlank()) {
            log.info("=== [DEV MODE] Email Verification OTP ===");
            log.info("To: {}", toEmail);
            log.info("OTP: {}", otp);
            log.info("==========================================");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

          helper.setFrom(mailUsername, "Nhà Hàng");
            helper.setTo(toEmail);
            helper.setSubject("Mã xác thực tài khoản của bạn");
            helper.setText(buildOtpEmailHtml(fullName, otp), true);

            mailSender.send(message);
            log.info("OTP email sent to {}", toEmail);
        } catch (MailAuthenticationException e) {
          log.error("SMTP authentication failed when sending OTP to {}: {}", toEmail, e.getMessage());
          handleMailFailure("Không thể xác thực SMTP để gửi OTP. Vui lòng kiểm tra Gmail và App Password.", otp, e);
        } catch (MailException e) {
          log.error("Mail transport error when sending OTP to {}: {}", toEmail, e.getMessage());
          handleMailFailure("Không thể gửi email OTP lúc này. Vui lòng thử lại sau ít phút.", otp, e);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Không thể gửi email OTP đến {}: {}", toEmail, e.getMessage());
          handleMailFailure("Không thể tạo nội dung email OTP. Vui lòng thử lại.", otp, e);
        }
    }

    private String buildOtpEmailHtml(String fullName, String otp) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                  <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 32px; text-align: center;">
                    <h2 style="color: #c0392b;">Xác thực tài khoản</h2>
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Mã xác thực của bạn là:</p>
                    <div style="background: #f9f9f9; border: 2px dashed #c0392b; border-radius: 8px; padding: 24px; margin: 24px 0;">
                      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #c0392b;">%s</span>
                    </div>
                    <p style="color: #888; font-size: 14px;">
                      Mã này có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
                    </p>
                    <p style="color: #888; font-size: 12px;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
                  </div>
                </body>
                </html>
                """.formatted(fullName, otp);
    }

    /**
     * Gửi email xác thực tài khoản (legacy - giữ lại cho backward compatibility).
     * Nếu mail chưa được cấu hình (username trống), in token ra console để test.
     */
    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        String verifyUrl = baseUrl + "/api/users/verify-email?token=" + token;

        if (mailUsername == null || mailUsername.isBlank()) {
            log.info("=== [DEV MODE] Email verification token ===");
            log.info("To: {}", toEmail);
            log.info("Verify URL: {}", verifyUrl);
            log.info("===========================================");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

          helper.setFrom(mailUsername, "Nhà Hàng");
            helper.setTo(toEmail);
            helper.setSubject("Xác thực tài khoản của bạn");
            helper.setText(buildVerificationEmailHtml(fullName, verifyUrl), true);

            mailSender.send(message);
            log.info("Verification email sent to {}", toEmail);
        } catch (MailAuthenticationException e) {
          log.error("SMTP authentication failed when sending verification mail to {}: {}", toEmail, e.getMessage());
          handleMailFailure("Không thể xác thực SMTP để gửi email xác thực. Vui lòng kiểm tra cấu hình mail.", verifyUrl, e);
        } catch (MailException e) {
          log.error("Mail transport error when sending verification mail to {}: {}", toEmail, e.getMessage());
          handleMailFailure("Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.", verifyUrl, e);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Không thể gửi email xác thực đến {}: {}", toEmail, e.getMessage());
          handleMailFailure("Không thể tạo nội dung email xác thực. Vui lòng thử lại.", verifyUrl, e);
        }
    }

    private void handleMailFailure(String userMessage, String fallbackValue, Exception e) {
        if (!failOnMailError) {
            log.warn("Mail send failed but failOnMailError=false, fallback value: {}", fallbackValue);
            return;
        }
        throw new RuntimeException(userMessage, e);
    }

    private String buildVerificationEmailHtml(String fullName, String verifyUrl) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head><meta charset="UTF-8"></head>
                <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
                  <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 32px;">
                    <h2 style="color: #c0392b;">Xác thực tài khoản</h2>
                    <p>Xin chào <strong>%s</strong>,</p>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại nhà hàng của chúng tôi.</p>
                    <p>Vui lòng bấm vào nút bên dưới để xác thực email của bạn:</p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="%s"
                         style="background: #c0392b; color: white; padding: 14px 28px;
                                text-decoration: none; border-radius: 6px; font-size: 16px;">
                        Xác thực Email
                      </a>
                    </div>
                    <p style="color: #888; font-size: 13px;">
                      Link có hiệu lực trong 24 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.
                    </p>
                    <p style="color: #888; font-size: 12px;">Hoặc copy link: %s</p>
                  </div>
                </body>
                </html>
                """.formatted(fullName, verifyUrl, verifyUrl);
    }
}
