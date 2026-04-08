package com.restaurant.paymentservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurant.paymentservice.client.OrderClient;
import com.restaurant.paymentservice.entity.Payment;
import com.restaurant.paymentservice.entity.PaymentRequest;
import com.restaurant.paymentservice.entity.PaymentTransaction;
import com.restaurant.paymentservice.provider.SepayPaymentProvider;
import com.restaurant.paymentservice.provider.SepayProperties;
import com.restaurant.paymentservice.provider.SepaySignatureVerifier;
import com.restaurant.paymentservice.repository.PaymentRepository;
import com.restaurant.paymentservice.repository.PaymentRequestRepository;
import com.restaurant.paymentservice.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final String STATUS_WAITING = "waiting";
    private static final String STATUS_PAID = "paid";
    private static final Pattern TX_REF_PATTERN = Pattern.compile("SP\\d+_\\d+");

    private final PaymentRequestRepository paymentRequestRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderClient orderClient;
    private final SocketService socketService;
    private final SepayPaymentProvider sepayPaymentProvider;
    private final SepaySignatureVerifier sepaySignatureVerifier;
    private final SepayProperties sepayProperties;
    private final ObjectMapper objectMapper;

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
        Optional<PaymentRequest> existingOpt = paymentRequestRepository.findByOrderIdAndStatus(orderId, STATUS_WAITING);
        if (existingOpt.isPresent()) {
            PaymentRequest existing = existingOpt.get();
            existing.setTotal(amount);
            existing.setRequestTime(LocalDateTime.now());
            paymentRequestRepository.save(existing);
        } else {
            PaymentRequest newRequest = new PaymentRequest();
            newRequest.setOrderId(orderId);
            newRequest.setTableId(tableId);
            newRequest.setTotal(amount);
            newRequest.setStatus(STATUS_WAITING);
            paymentRequestRepository.save(newRequest);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("order_id", orderId);
        payload.put("table_id", tableId);
        payload.put("table_key", tableKey);
        payload.put("amount", amount);
        socketService.emitPaymentRequest(payload);
    }

    @Transactional
    public Map<String, Object> processCashPayment(Integer orderId, Integer tableId, String tableKey, String authHeader) {
        PaymentRequest request = paymentRequestRepository.findByOrderIdAndStatus(orderId, STATUS_WAITING)
                .orElseThrow(() -> new RuntimeException("Khong tim thay yeu cau thanh toan"));

        return completeSessionPayment(request, tableId, tableKey, authHeader, "cash", null);
    }

    @Transactional
    public Map<String, Object> createSepayPayment(Map<String, Object> payload) {
        Integer orderId = parseRequiredInt(payload, "order_id");
        Integer tableId = parseRequiredInt(payload, "table_id");
        String tableKey = asString(payload.get("table_key"));
        BigDecimal amount = parseRequiredAmount(payload.get("amount"));

        createPaymentRequest(orderId, tableId, tableKey, amount);

        PaymentRequest request = paymentRequestRepository.findByOrderIdAndStatus(orderId, STATUS_WAITING)
                .orElseThrow(() -> new RuntimeException("Khong tim thay payment request waiting"));

        LocalDateTime expireAt = LocalDateTime.now().plusMinutes(Math.max(1, sepayProperties.getTimeoutMinutes()));
        String transactionRef = generateTransactionRef(orderId);

        PaymentTransaction tx = new PaymentTransaction();
        tx.setPaymentRequestId(request.getId());
        tx.setOrderId(orderId);
        tx.setTableId(tableId);
        tx.setTableKey(tableKey);
        tx.setProvider("sepay");
        tx.setTransactionRef(transactionRef);
        tx.setStatus("PENDING");
        tx.setAmount(amount);
        tx.setExpireAt(expireAt);

        Map<String, Object> providerRes = sepayPaymentProvider.createPayment(
                transactionRef,
                amount,
                "Thanh toan don #" + orderId,
                expireAt
        );

        tx.setProviderReference(asString(providerRes.get("provider_reference")));
        tx.setQrContent(asString(providerRes.get("qr_content")));
        tx.setQrImageUrl(asString(providerRes.get("qr_image_url")));
        tx.setPayUrl(asString(providerRes.get("pay_url")));
        tx.setRawCreatePayload(toJson(providerRes.get("raw")));

        paymentTransactionRepository.save(tx);

        Map<String, Object> wsPayload = new HashMap<>();
        wsPayload.put("transaction_ref", tx.getTransactionRef());
        wsPayload.put("order_id", tx.getOrderId());
        wsPayload.put("table_id", tx.getTableId());
        wsPayload.put("status", tx.getStatus());
        wsPayload.put("amount", tx.getAmount());
        socketService.emitPaymentStatusUpdated(wsPayload);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("provider", "sepay");
        result.put("transaction_ref", tx.getTransactionRef());
        result.put("provider_reference", tx.getProviderReference());
        result.put("status", tx.getStatus());
        result.put("amount", tx.getAmount());
        result.put("expire_at", tx.getExpireAt());
        result.put("qr_content", tx.getQrContent());
        result.put("qr_image_url", tx.getQrImageUrl());
        result.put("pay_url", tx.getPayUrl());
        return result;
    }

    @Transactional
    public Map<String, Object> processSepayWebhook(String rawPayload, String signature) {
        if (!sepaySignatureVerifier.isValid(rawPayload, signature)) {
            throw new SecurityException("Invalid SePay signature");
        }

        Map<String, Object> data = parseJsonMap(rawPayload);
        String transactionRef = extractTransactionRefFromWebhook(data);
        String providerReference = firstNonBlank(
                asString(data.get("provider_reference")),
                asString(data.get("providerReference")),
                asString(data.get("id"))
        );

        PaymentTransaction tx = findTransaction(transactionRef, providerReference);
        if (tx == null) {
            return Map.of("success", true, "ignored", "TRANSACTION_NOT_FOUND");
        }

        tx.setRawWebhookPayload(rawPayload);

        String incomingStatus = normalizeSepayStatus(firstNonBlank(
                asString(data.get("status")),
                asString(data.get("payment_status")),
                asString(data.get("transaction_status"))
        ));

        if ("PAID".equals(tx.getStatus()) && "PAID".equals(incomingStatus)) {
            return Map.of("success", true, "idempotent", true, "transaction_ref", tx.getTransactionRef());
        }

        if ("PAID".equals(incomingStatus)) {
            boolean wasExpired = "EXPIRED".equals(tx.getStatus());
            tx.setStatus("PAID");
            tx.setPaidAt(LocalDateTime.now());
            if (wasExpired) {
                tx.setRefundRequiredManual(true);
            }
            paymentTransactionRepository.save(tx);

            Map<String, Object> wsPayload = new HashMap<>();
            wsPayload.put("transaction_ref", tx.getTransactionRef());
            wsPayload.put("order_id", tx.getOrderId());
            wsPayload.put("table_id", tx.getTableId());
            wsPayload.put("status", tx.getStatus());
            wsPayload.put("amount", tx.getAmount());
            wsPayload.put("refund_required_manual", tx.getRefundRequiredManual());
            socketService.emitPaymentStatusUpdated(wsPayload);

            if (!wasExpired) {
                try {
                    PaymentRequest request = paymentRequestRepository.findByOrderIdAndStatus(tx.getOrderId(), STATUS_WAITING)
                            .orElse(null);
                    if (request != null) {
                        completeSessionPayment(request, tx.getTableId(), tx.getTableKey(), null, "sepay", tx);
                    } else {
                        tx.setStatus("PAID_PENDING_SYNC");
                        paymentTransactionRepository.save(tx);
                    }
                } catch (Exception ex) {
                    tx.setStatus("PAID_PENDING_SYNC");
                    paymentTransactionRepository.save(tx);
                    log.error("Could not sync order-service after SePay paid webhook", ex);
                }
            }

            return Map.of(
                    "success", true,
                    "transaction_ref", tx.getTransactionRef(),
                    "status", tx.getStatus(),
                    "refund_required_manual", Boolean.TRUE.equals(tx.getRefundRequiredManual())
            );
        }

        if ("FAILED".equals(incomingStatus)) {
            tx.setStatus("FAILED");
            paymentTransactionRepository.save(tx);
        } else if ("EXPIRED".equals(incomingStatus)) {
            tx.setStatus("EXPIRED");
            paymentTransactionRepository.save(tx);
        }

        return Map.of("success", true, "transaction_ref", tx.getTransactionRef(), "status", tx.getStatus());
    }

    public Map<String, Object> getSepayStatus(String transactionRef) {
        PaymentTransaction tx = paymentTransactionRepository.findByTransactionRef(transactionRef)
                .orElseThrow(() -> new RuntimeException("Khong tim thay giao dich"));

        Map<String, Object> result = new HashMap<>();
        result.put("transaction_ref", tx.getTransactionRef());
        result.put("provider_reference", tx.getProviderReference());
        result.put("status", tx.getStatus());
        result.put("amount", tx.getAmount());
        result.put("expire_at", tx.getExpireAt());
        result.put("paid_at", tx.getPaidAt());
        result.put("refund_required_manual", tx.getRefundRequiredManual());
        result.put("refunded_manual", tx.getRefundedManual());
        result.put("qr_content", tx.getQrContent());
        result.put("qr_image_url", tx.getQrImageUrl());
        result.put("pay_url", tx.getPayUrl());
        return result;
    }

    public List<Map<String, Object>> listSepayTransactions(String status, String query) {
        List<PaymentTransaction> transactions = paymentTransactionRepository.findTop200ByProviderOrderByCreatedAtDesc("sepay");

        return transactions.stream()
                .filter(tx -> status == null || status.isBlank() || status.equalsIgnoreCase(tx.getStatus()))
                .filter(tx -> {
                    if (query == null || query.isBlank()) return true;
                    String q = query.trim().toLowerCase();
                    return contains(tx.getTransactionRef(), q)
                            || contains(tx.getProviderReference(), q)
                            || String.valueOf(tx.getOrderId()).contains(q);
                })
                .map(this::toTransactionMap)
                .toList();
    }

    @Transactional
    public Map<String, Object> markRefundHandled(String transactionRef, String refundedBy, String note) {
        PaymentTransaction tx = paymentTransactionRepository.findByTransactionRef(transactionRef)
                .orElseThrow(() -> new RuntimeException("Khong tim thay giao dich"));

        tx.setRefundedManual(true);
        tx.setRefundedBy((refundedBy == null || refundedBy.isBlank()) ? "unknown" : refundedBy);
        tx.setRefundedAt(LocalDateTime.now());
        tx.setRefundNote(note);
        paymentTransactionRepository.save(tx);

        return toTransactionMap(tx);
    }

    @Transactional
    public int expirePendingTransactions() {
        List<PaymentTransaction> expired = paymentTransactionRepository
                .findByProviderAndStatusAndExpireAtBefore("sepay", "PENDING", LocalDateTime.now());

        for (PaymentTransaction tx : expired) {
            tx.setStatus("EXPIRED");
            paymentTransactionRepository.save(tx);

            Map<String, Object> wsPayload = new HashMap<>();
            wsPayload.put("transaction_ref", tx.getTransactionRef());
            wsPayload.put("order_id", tx.getOrderId());
            wsPayload.put("table_id", tx.getTableId());
            wsPayload.put("status", tx.getStatus());
            wsPayload.put("amount", tx.getAmount());
            socketService.emitPaymentStatusUpdated(wsPayload);
        }

        return expired.size();
    }

    @Transactional
    public int retryPendingSyncTransactions() {
        List<PaymentTransaction> pendingSync = paymentTransactionRepository
                .findTop100ByProviderAndStatusOrderByCreatedAtAsc("sepay", "PAID_PENDING_SYNC");

        int successCount = 0;
        for (PaymentTransaction tx : pendingSync) {
            try {
                PaymentRequest request = paymentRequestRepository.findByOrderIdAndStatus(tx.getOrderId(), STATUS_WAITING)
                        .orElse(null);
                if (request == null) {
                    continue;
                }
                completeSessionPayment(request, tx.getTableId(), tx.getTableKey(), null, "sepay", tx);
                successCount++;
            } catch (Exception ex) {
                log.warn("Retry sync failed for txRef={}", tx.getTransactionRef());
            }
        }
        return successCount;
    }

    public List<Map<String, Object>> getPaymentHistory() {
        return paymentRepository.getPaymentHistory();
    }

    @Transactional
    protected Map<String, Object> completeSessionPayment(PaymentRequest request,
                                                         Integer tableId,
                                                         String tableKey,
                                                         String authHeader,
                                                         String paymentMethod,
                                                         PaymentTransaction transaction) {
        Integer orderId = request.getOrderId();

        validateOrderNotPaid(orderId);

        Integer finalTableId = tableId != null ? tableId : request.getTableId();
        String finalTableKey = (tableKey != null && !tableKey.isBlank())
                ? tableKey
                : paymentRequestRepository.getTableKeyForOrder(orderId);

        if (finalTableId == null || finalTableKey == null) {
            throw new RuntimeException("Thieu thong tin ban hoac table_key de hoan tat thanh toan");
        }

        List<Integer> allOrderIds = paymentRequestRepository.findWaitingOrderIdsForSession(finalTableId, finalTableKey);
        if (allOrderIds == null || allOrderIds.isEmpty()) {
            allOrderIds = List.of(orderId);
        }

        List<PaymentRequest> sessionRequests = paymentRequestRepository.findByOrderIdInAndStatus(allOrderIds, STATUS_WAITING);
        if (sessionRequests.isEmpty()) {
            sessionRequests = List.of(request);
        }

        BigDecimal sessionTotal = BigDecimal.ZERO;
        for (PaymentRequest paymentRequest : sessionRequests) {
            if (!STATUS_WAITING.equals(paymentRequest.getStatus())) {
                continue;
            }
            paymentRequest.setStatus(STATUS_PAID);
            paymentRequestRepository.save(paymentRequest);

            Payment payment = new Payment();
            payment.setOrderId(paymentRequest.getOrderId());
            payment.setAmount(paymentRequest.getTotal());
            payment.setMethod(paymentMethod);
            paymentRepository.save(payment);

            sessionTotal = sessionTotal.add(paymentRequest.getTotal());
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("table_id", finalTableId);
        payload.put("table_key", finalTableKey);
        payload.put("order_ids", allOrderIds);

        String effectiveAuth = authHeader;
        if ((effectiveAuth == null || effectiveAuth.isBlank()) && sepayProperties.getInternalAuthHeader() != null && !sepayProperties.getInternalAuthHeader().isBlank()) {
            effectiveAuth = sepayProperties.getInternalAuthHeader();
        }

        Map<String, Object> completionRes = orderClient.completePayment(effectiveAuth, payload);
        if (completionRes.containsKey("order_ids")) {
            @SuppressWarnings("unchecked")
            List<Integer> fetchedIds = (List<Integer>) completionRes.get("order_ids");
            allOrderIds = fetchedIds;
        }

        if (transaction != null) {
            transaction.setStatus("PAID");
            paymentTransactionRepository.save(transaction);
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
        result.put("message", "Thanh toan thanh cong");
        result.put("order_count", allOrderIds.size());
        result.put("total_amount", sessionTotal);
        return result;
    }

    private void validateOrderNotPaid(Integer orderId) {
        try {
            Map<String, Object> orderData = orderClient.getOrder(orderId);
            if (orderData == null) {
                throw new RuntimeException("Don hang khong ton tai");
            }
            Object paymentStatus = orderData.get("payment_status");
            if ("paid".equals(paymentStatus)) {
                throw new RuntimeException("Don hang da duoc thanh toan truoc do");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Khong the xac thuc order tu order-service: {}", e.getMessage());
        }
    }

    private PaymentTransaction findTransaction(String transactionRef, String providerReference) {
        if (transactionRef != null && !transactionRef.isBlank()) {
            Optional<PaymentTransaction> byRef = paymentTransactionRepository.findByTransactionRef(transactionRef);
            if (byRef.isPresent()) {
                return byRef.get();
            }
        }
        if (providerReference != null && !providerReference.isBlank()) {
            return paymentTransactionRepository.findByProviderAndProviderReference("sepay", providerReference).orElse(null);
        }
        return null;
    }

    private String normalizeSepayStatus(String value) {
        if (value == null || value.isBlank()) {
            return "UNKNOWN";
        }
        String normalized = value.trim().toUpperCase();
        if (Set.of("PAID", "SUCCESS", "COMPLETED").contains(normalized)) {
            return "PAID";
        }
        if (Set.of("FAILED", "FAIL", "CANCELED", "CANCELLED").contains(normalized)) {
            return "FAILED";
        }
        if (Set.of("EXPIRED", "TIMEOUT").contains(normalized)) {
            return "EXPIRED";
        }
        return normalized;
    }

    private String extractTransactionRefFromWebhook(Map<String, Object> data) {
        String[] candidates = new String[]{
                asString(data.get("transaction_ref")),
                asString(data.get("reference")),
                asString(data.get("transactionId")),
                asString(data.get("code")),
                asString(data.get("content")),
                asString(data.get("description")),
                asString(data.get("transfer_content")),
                asString(data.get("transferContent")),
                asString(data.get("transaction_content"))
        };

        for (String candidate : candidates) {
            String extracted = extractTransactionRef(candidate);
            if (extracted != null) {
                return extracted;
            }
        }
        return null;
    }

    private String extractTransactionRef(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        if (TX_REF_PATTERN.matcher(trimmed).matches()) {
            return trimmed;
        }
        Matcher matcher = TX_REF_PATTERN.matcher(trimmed);
        if (matcher.find()) {
            return matcher.group();
        }
        return null;
    }

    private Map<String, Object> parseJsonMap(String rawPayload) {
        if (rawPayload == null || rawPayload.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(rawPayload, new TypeReference<>() {});
        } catch (Exception ex) {
            return Map.of();
        }
    }

    private String generateTransactionRef(Integer orderId) {
        return "SP" + orderId + "_" + System.currentTimeMillis();
    }

    private Integer parseRequiredInt(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null) {
            throw new IllegalArgumentException(key + " la bat buoc");
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(value.toString());
    }

    private BigDecimal parseRequiredAmount(Object value) {
        if (value == null) {
            throw new IllegalArgumentException("amount la bat buoc");
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return new BigDecimal(number.toString());
        }
        return new BigDecimal(value.toString());
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return String.valueOf(value);
        }
    }

    private boolean contains(String source, String query) {
        return source != null && source.toLowerCase().contains(query);
    }

    private Map<String, Object> toTransactionMap(PaymentTransaction tx) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", tx.getId());
        result.put("provider", tx.getProvider());
        result.put("transaction_ref", tx.getTransactionRef());
        result.put("provider_reference", tx.getProviderReference());
        result.put("order_id", tx.getOrderId());
        result.put("table_id", tx.getTableId());
        result.put("status", tx.getStatus());
        result.put("amount", tx.getAmount());
        result.put("expire_at", tx.getExpireAt());
        result.put("paid_at", tx.getPaidAt());
        result.put("refund_required_manual", tx.getRefundRequiredManual());
        result.put("refunded_manual", tx.getRefundedManual());
        result.put("refunded_by", tx.getRefundedBy());
        result.put("refunded_at", tx.getRefundedAt());
        result.put("refund_note", tx.getRefundNote());
        result.put("created_at", tx.getCreatedAt());
        result.put("updated_at", tx.getUpdatedAt());
        return result;
    }
}
