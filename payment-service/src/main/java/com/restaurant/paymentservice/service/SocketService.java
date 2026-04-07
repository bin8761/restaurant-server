package com.restaurant.paymentservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void emitPaymentRequest(Map<String, Object> data) {
        log.info("WebSocket emit payment_request: tableId={}", data.get("table_id"));
        messagingTemplate.convertAndSend("/topic/payment.request", data);
    }

    public void emitPaymentCompleted(Map<String, Object> data) {
        log.info("WebSocket emit payment_completed: tableId={}", data.get("table_id"));
        messagingTemplate.convertAndSend("/topic/payment.completed", data);
    }

    public void emitPaymentStatusUpdated(Map<String, Object> data) {
        log.info("WebSocket emit payment_status_updated: txRef={}, status={}",
                data.get("transaction_ref"),
                data.get("status"));
        messagingTemplate.convertAndSend("/topic/payment.status", data);
    }
}
