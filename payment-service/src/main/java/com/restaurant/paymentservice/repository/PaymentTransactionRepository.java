package com.restaurant.paymentservice.repository;

import com.restaurant.paymentservice.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByTransactionRef(String transactionRef);

    Optional<PaymentTransaction> findByProviderAndProviderReference(String provider, String providerReference);

    List<PaymentTransaction> findTop200ByProviderOrderByCreatedAtDesc(String provider);

    List<PaymentTransaction> findByProviderAndStatusAndExpireAtBefore(String provider, String status, LocalDateTime now);

    List<PaymentTransaction> findTop100ByProviderAndStatusOrderByCreatedAtAsc(String provider, String status);

    List<PaymentTransaction> findTop20ByProviderAndStatusInAndAmountOrderByCreatedAtDesc(String provider,
                                                                                          List<String> statuses,
                                                                                          BigDecimal amount);

    List<PaymentTransaction> findTop20ByProviderAndStatusInOrderByCreatedAtDesc(String provider,
                                                                                 List<String> statuses);

    Optional<PaymentTransaction> findTopByProviderAndOrderIdAndStatusInOrderByCreatedAtDesc(String provider,
                                                                                              Integer orderId,
                                                                                              List<String> statuses);

    Optional<PaymentTransaction> findTopByProviderAndOrderIdAndStatusOrderByCreatedAtDesc(String provider,
                                                                                           Integer orderId,
                                                                                           String status);
}
