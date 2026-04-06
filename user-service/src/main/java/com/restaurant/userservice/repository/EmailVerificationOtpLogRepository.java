package com.restaurant.userservice.repository;

import com.restaurant.userservice.entity.EmailVerificationOtpLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailVerificationOtpLogRepository extends JpaRepository<EmailVerificationOtpLog, Long> {

    List<EmailVerificationOtpLog> findAllByEmailAndValidTrueAndUsedFalse(String email);

    Optional<EmailVerificationOtpLog> findTopByEmailAndValidTrueAndUsedFalseOrderBySentAtDescIdDesc(String email);
}
