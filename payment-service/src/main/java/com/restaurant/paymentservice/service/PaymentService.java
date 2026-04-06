package com.restaurant.paymentservice.service;

import com.restaurant.paymentservice.client.OrderClient;
import com.restaurant.paymentservice.entity.Payment;
import com.restaurant.paymentservice.entity.PaymentRequest;
import com.restaurant.paymentservice.repository.PaymentRepository;
import com.restaurant.paymentservice.repository.PaymentRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRequestRepository paymentRequestRepository;
    private final PaymentRepository paymentRepository;
    private final OrderClient orderClient;
    private final SocketService socketService;

    public List<Map<String, Object>> getWaitingPayments() {
        List<Map<String, Object>> requests = paymentRequestRepository.getWaitingPaymentsWithTableKey();
        Map<String, Map<String, Object>> sessionMap = new HashMap<>();

        for (Map<String, Object> req : requests) {
            Integer tableId = (Integer) req.get("table_id");
            String tableKey = (String) req.get("table_key");
            String sessionKey = tableId + "_" + (tableKey != null ? tableKey : "no_key");

            if (!sessionMap.containsKey(sessionKey)) {
                Integer orderCount = tableKey != null
                        ? paymentRequestRepository.countUnpaidOrdersForSession(tableId, tableKey)
                        : 1;

                if (orderCount == null || orderCount == 0) {
                    orderCount = 1;
                }

                Map<String, Object> sessionData = new HashMap<>(req);
                sessionData.put("order_count", orderCount);
                sessionMap.put(sessionKey, sessionData);
            } else {
                Map<String, Object> existing = sessionMap.get(sessionKey);
                BigDecimal currentTotal = (BigDecimal) req.get("total");
                BigDecimal existingTotal = (BigDecimal) existing.get("total");
                existing.put("total", existingTotal.add(currentTotal));

                LocalDateTime currentRequestTime = (LocalDateTime) req.get("request_time");
                LocalDateTime existingRequestTime = (LocalDateTime) existing.get("request_time");
                if (currentRequestTime.isBefore(existingRequestTime)) {
                    existing.put("request_time", currentRequestTime);
                }
            }
        }
        return new ArrayList<>(sessionMap.values());
    }

    @Transactional
    public void createPaymentRequest(Integer orderId, Integer tableId, String tableKey, BigDecimal amount) {
        log.info("💾 Creating payment request - Order: {}, Table: {}, Amount: {}", orderId, tableId, amount);

        Optional<PaymentRequest> existingOpt = paymentRequestRepository.findByOrderIdAndStatus(orderId, "waiting");
        if (existingOpt.isPresent()) {
            PaymentRequest existing = existingOpt.get();
            log.info("📝 Updating existing payment request - Old amount: {}, New amount: {}", existing.getTotal(), amount);
            existing.setTotal(amount);
            existing.setRequestTime(LocalDateTime.now());
            paymentRequestRepository.save(existing);
        } else {
            PaymentRequest newRequest = new PaymentRequest();
            newRequest.setOrderId(orderId);
            newRequest.setTableId(tableId);
            newRequest.setTotal(amount);
            newRequest.setStatus("waiting");
            paymentRequestRepository.save(newRequest);
            log.info("✨ New payment request saved - ID: {}, Amount: {}", newRequest.getId(), newRequest.getTotal());
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("order_id", orderId);
        payload.put("table_id", tableId);
        payload.put("table_key", tableKey);
        payload.put("amount", amount);

        log.info("📤 Broadcasting webhook payload: {}", payload);
        socketService.emitPaymentRequest(payload);
    }

    @Transactional
    public Map<String, Object> processCashPayment(Integer orderId, Integer tableId, String tableKey, String authHeader) {
        log.info("💳 Processing cash payment - Order: {}, Table: {}, TableKey: {}", orderId, tableId, tableKey);

        PaymentRequest request = paymentRequestRepository.findByOrderIdAndStatus(orderId, "waiting")
                .orElseThrow(() -> {
                    log.error("❌ Payment request not found for order: {}", orderId);
                    return new RuntimeException("Không tìm thấy yêu cầu thanh toán");
                });

        // BUG-013: Validate order còn tồn tại trong order-service
        try {
            Map<String, Object> orderData = orderClient.getOrder(orderId);
            if (orderData == null) {
                throw new RuntimeException("Đơn hàng không tồn tại");
            }
            Object paymentStatus = orderData.get("payment_status");
            if ("paid".equals(paymentStatus)) {
                throw new RuntimeException("Đơn hàng đã được thanh toán trước đó");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.warn("⚠️ Không thể xác thực order từ order-service: {}", e.getMessage());
        }

        Integer finalTableId = tableId != null ? tableId : request.getTableId();
        String finalTableKey = tableKey;
        if (finalTableKey == null) {
            finalTableKey = paymentRequestRepository.getTableKeyForOrder(orderId);
        }

        if (finalTableId == null || finalTableKey == null) {
            throw new RuntimeException("Thiếu thông tin bàn hoặc table_key để hoàn tất thanh toán");
        }

        List<Integer> allOrderIds = paymentRequestRepository.findWaitingOrderIdsForSession(finalTableId, finalTableKey);
        if (allOrderIds == null || allOrderIds.isEmpty()) {
            allOrderIds = List.of(orderId);
        }

        List<PaymentRequest> sessionRequests = paymentRequestRepository.findByOrderIdInAndStatus(allOrderIds, "waiting");
        if (sessionRequests.isEmpty()) {
            sessionRequests = List.of(request);
        }

        BigDecimal sessionTotal = BigDecimal.ZERO;
        for (PaymentRequest paymentRequest : sessionRequests) {
            // BUG-014: Kiểm tra lại status trước khi xử lý — tránh double payment
            if (!"waiting".equals(paymentRequest.getStatus())) {
                log.warn("⚠️ PaymentRequest {} already has status '{}', skipping", paymentRequest.getId(), paymentRequest.getStatus());
                continue;
            }
            paymentRequest.setStatus("paid");
            paymentRequestRepository.save(paymentRequest);

            Payment payment = new Payment();
            payment.setOrderId(paymentRequest.getOrderId());
            payment.setAmount(paymentRequest.getTotal());
            payment.setMethod("cash");
            paymentRepository.save(payment);

            sessionTotal = sessionTotal.add(paymentRequest.getTotal());
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("table_id", finalTableId);
            payload.put("table_key", finalTableKey);
            payload.put("order_ids", allOrderIds);

            log.info("📤 Calling order-service to complete payment...");
            Map<String, Object> completionRes = orderClient.completePayment(authHeader, payload);
            log.info("✅ Order service response: {}", completionRes);

            if (completionRes.containsKey("order_ids")) {
                @SuppressWarnings("unchecked")
                List<Integer> fetchedIds = (List<Integer>) completionRes.get("order_ids");
                allOrderIds = fetchedIds;
            }
        } catch (Exception e) {
            log.error("❌ Error calling order-service: {}", e.getMessage(), e);
            throw new RuntimeException("Không thể hoàn tất phiên thanh toán tại order-service", e);
        }

        Map<String, Object> wsPayload = new HashMap<>();
        wsPayload.put("request_id", request.getId());
        wsPayload.put("order_id", orderId);
        wsPayload.put("order_ids", allOrderIds);
        wsPayload.put("table_id", finalTableId);
        wsPayload.put("amount", sessionTotal);
        socketService.emitPaymentCompleted(wsPayload);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Thanh toán thành công");
        result.put("order_count", allOrderIds.size());
        result.put("total_amount", sessionTotal);
        return result;
    }

    public List<Map<String, Object>> getPaymentHistory() {
        return paymentRepository.getPaymentHistory();
    }
}
