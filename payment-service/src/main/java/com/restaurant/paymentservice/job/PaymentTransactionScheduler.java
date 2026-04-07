package com.restaurant.paymentservice.job;

import com.restaurant.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentTransactionScheduler {

    private final PaymentService paymentService;

    @Scheduled(fixedDelayString = "${payment.sepay.timeout-check-ms:30000}")
    public void expirePendingTransactions() {
        int count = paymentService.expirePendingTransactions();
        if (count > 0) {
            log.info("Expired {} pending SePay transactions", count);
        }
    }

    @Scheduled(fixedDelayString = "${payment.sepay.retry-sync-ms:45000}")
    public void retryPendingSyncTransactions() {
        int count = paymentService.retryPendingSyncTransactions();
        if (count > 0) {
            log.info("Recovered {} PAID_PENDING_SYNC transactions", count);
        }
    }
}
