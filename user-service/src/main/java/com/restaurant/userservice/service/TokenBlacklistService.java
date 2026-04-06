package com.restaurant.userservice.service;

import com.restaurant.userservice.entity.RevokedToken;
import com.restaurant.userservice.repository.RevokedTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * BUG-007 (fix đầy đủ): Server-side token blacklist lưu vào MySQL.
 * Bền vững qua restart, hoạt động đúng cho multi-instance deployment.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private final RevokedTokenRepository revokedTokenRepository;

    /**
     * Thêm token vào blacklist.
     *
     * @param token        chuỗi JWT gốc
     * @param expiryMillis thời điểm hết hạn của token (epoch ms)
     */
    @Transactional
    public void blacklist(String token, long expiryMillis) {
        if (!revokedTokenRepository.existsByToken(token)) {
            revokedTokenRepository.save(new RevokedToken(token, Instant.ofEpochMilli(expiryMillis)));
        }
    }

    public boolean isBlacklisted(String token) {
        return revokedTokenRepository.existsByToken(token);
    }

    /** Dọn dẹp các token đã hết hạn mỗi giờ để tránh bảng phình to. */
    @Scheduled(fixedRate = 3_600_000)
    @Transactional
    public void evictExpired() {
        revokedTokenRepository.deleteExpiredTokens(Instant.now());
        log.debug("Đã dọn dẹp revoked tokens hết hạn");
    }
}

