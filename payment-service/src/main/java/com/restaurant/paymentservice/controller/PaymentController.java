package com.restaurant.paymentservice.controller;

import com.restaurant.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/waiting")
    public ResponseEntity<List<Map<String, Object>>> getWaitingPayments() {
        return ResponseEntity.ok(paymentService.getWaitingPayments());
    }

    @PostMapping("/request")
    public ResponseEntity<Map<String, Boolean>> createPaymentRequest(@RequestBody Map<String, Object> payload) {
        Integer orderId = ((Number) payload.get("order_id")).intValue();
        Integer tableId = ((Number) payload.get("table_id")).intValue();
        String tableKey = (String) payload.get("table_key");
        BigDecimal amount = new BigDecimal(String.valueOf(payload.get("amount")));

        paymentService.createPaymentRequest(orderId, tableId, tableKey, amount);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/process/cash")
    public ResponseEntity<Map<String, Object>> processCashPayment(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        Integer orderId = ((Number) payload.get("order_id")).intValue();
        Integer tableId = ((Number) payload.get("table_id")).intValue();
        String tableKey = (String) payload.get("table_key");

        Map<String, Object> result = paymentService.processCashPayment(orderId, tableId, tableKey, authHeader);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/sepay/create")
    public ResponseEntity<Map<String, Object>> createSepayPayment(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(paymentService.createSepayPayment(payload));
    }

    @PostMapping("/sepay/webhook")
    public ResponseEntity<Map<String, Object>> sepayWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "X-SePay-Signature", required = false) String signature,
            @RequestHeader(value = "X-Sepay-Signature", required = false) String signatureAlt) {

        String effectiveSignature = signature != null ? signature : signatureAlt;
        try {
            return ResponseEntity.ok(paymentService.processSepayWebhook(rawPayload, effectiveSignature));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("success", false, "error", ex.getMessage()));
        } catch (Exception ex) {
            log.error("SePay webhook processing failed", ex);
            return ResponseEntity.ok(Map.of("success", false, "error", ex.getMessage()));
        }
    }

    @GetMapping("/sepay/{transactionRef}/status")
    public ResponseEntity<Map<String, Object>> getSepayStatus(@PathVariable String transactionRef) {
        return ResponseEntity.ok(paymentService.getSepayStatus(transactionRef));
    }

    @GetMapping("/sepay/transactions")
    public ResponseEntity<List<Map<String, Object>>> listSepayTransactions(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "query", required = false) String query) {
        return ResponseEntity.ok(paymentService.listSepayTransactions(status, query));
    }

    @PostMapping("/sepay/{transactionRef}/mark-refund-handled")
    public ResponseEntity<Map<String, Object>> markRefundHandled(
            @PathVariable String transactionRef,
            @RequestBody(required = false) Map<String, Object> payload,
            Principal principal) {

        String note = payload != null ? String.valueOf(payload.getOrDefault("note", "")) : "";
        String actor = principal != null ? principal.getName() : "admin";
        return ResponseEntity.ok(paymentService.markRefundHandled(transactionRef, actor, note));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getPaymentHistory() {
        return ResponseEntity.ok(paymentService.getPaymentHistory());
    }
}
