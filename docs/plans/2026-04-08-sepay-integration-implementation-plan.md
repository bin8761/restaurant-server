# SePay Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add SePay payment end-to-end (backend + customer UI + admin UI) while keeping existing cash flow fully compatible.

**Architecture:** Extend `payment-service` with provider-based payment handling (`cash` + `sepay`) and add a dedicated transaction lifecycle for SePay webhook/idempotency/timeout handling. Keep `api-gateway` as router only, update `table-service` static frontend for SePay checkout UX, and add admin monitoring + manual refund-handled operation in `Fe-Admin`.

**Tech Stack:** Java 21, Spring Boot 3.2.x, Spring Data JPA, Spring WebSocket, OpenFeign, MySQL, Next.js 16, TypeScript, static JS in table-service, Maven, npm.

---

### Task 1: Establish Payment-Service Test Foundation

**Files:**
- Modify: `payment-service/pom.xml`
- Create: `payment-service/src/test/java/com/restaurant/paymentservice/provider/SepaySignatureVerifierTest.java`
- Create: `payment-service/src/test/java/com/restaurant/paymentservice/service/SepayWebhookIdempotencyTest.java`

**Step 1: Write the failing test**

```java
package com.restaurant.paymentservice.provider;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SepaySignatureVerifierTest {
    @Test
    void shouldRejectWhenSignatureInvalid() {
        SepaySignatureVerifier verifier = new SepaySignatureVerifier("secret");
        assertFalse(verifier.isValid("{\"amount\":1000}", "bad-signature"));
    }
}
```

**Step 2: Run test to verify it fails**

Run: `..\.maven\apache-maven-3.9.6\bin\mvn.cmd -q -Dtest=SepaySignatureVerifierTest test` (in `payment-service`)
Expected: FAIL because `SepaySignatureVerifier` does not exist and test dependencies are missing.

**Step 3: Write minimal implementation**

```xml
<!-- payment-service/pom.xml -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
</dependency>
```

```java
package com.restaurant.paymentservice.provider;

import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class SepaySignatureVerifier {
    private final String secret;

    public SepaySignatureVerifier(String secret) {
        this.secret = secret;
    }

    public boolean isValid(String payload, String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String hex = java.util.HexFormat.of().formatHex(digest);
            return hex.equalsIgnoreCase(signature);
        } catch (Exception e) {
            return false;
        }
    }
}
```

**Step 4: Run test to verify it passes**

Run: `..\.maven\apache-maven-3.9.6\bin\mvn.cmd -q -Dtest=SepaySignatureVerifierTest test`
Expected: PASS.

**Step 5: Commit**

```bash
git add payment-service/pom.xml payment-service/src/test/java/com/restaurant/paymentservice/provider/SepaySignatureVerifierTest.java payment-service/src/main/java/com/restaurant/paymentservice/provider/SepaySignatureVerifier.java
git commit -m "test(payment-service): add SePay signature verifier test foundation"
```

### Task 2: Add Provider and Transaction Domain Model

**Files:**
- Create: `payment-service/src/main/java/com/restaurant/paymentservice/entity/PaymentTransaction.java`
- Create: `payment-service/src/main/java/com/restaurant/paymentservice/repository/PaymentTransactionRepository.java`
- Create: `payment-service/src/main/java/com/restaurant/paymentservice/provider/PaymentProvider.java`
- Create: `payment-service/src/main/java/com/restaurant/paymentservice/provider/CashPaymentProvider.java`
- Create: `payment-service/src/main/java/com/restaurant/paymentservice/provider/SepayPaymentProvider.java`
- Create: `payment-service/src/test/java/com/restaurant/paymentservice/provider/PaymentProviderRoutingTest.java`

**Step 1: Write the failing test**

```java
@Test
void shouldResolveSepayProviderByMethod() {
    PaymentProviderRegistry registry = new PaymentProviderRegistry(java.util.List.of(
        new CashPaymentProvider(), new SepayPaymentProvider()
    ));
    assertEquals("sepay", registry.get("sepay").method());
}
```

**Step 2: Run test to verify it fails**

Run: `..\.maven\apache-maven-3.9.6\bin\mvn.cmd -q -Dtest=PaymentProviderRoutingTest test`
Expected: FAIL because registry/provider classes do not exist.

**Step 3: Write minimal implementation**

```java
public interface PaymentProvider {
    String method();
}

@Entity
@Table(name = "payment_transactions", uniqueConstraints = {
    @UniqueConstraint(name = "uk_provider_reference", columnNames = {"provider", "provider_reference"}),
    @UniqueConstraint(name = "uk_transaction_ref", columnNames = {"transaction_ref"})
})
public class PaymentTransaction {
    // fields: provider, transactionRef, providerReference, status, amount, expireAt, refundRequiredManual, ...
}
```

**Step 4: Run test to verify it passes**

Run: `..\.maven\apache-maven-3.9.6\bin\mvn.cmd -q -Dtest=PaymentProviderRoutingTest test`
Expected: PASS.

**Step 5: Commit**

```bash
git add payment-service/src/main/java/com/restaurant/paymentservice/entity/PaymentTransaction.java payment-service/src/main/java/com/restaurant/paymentservice/repository/PaymentTransactionRepository.java payment-service/src/main/java/com/restaurant/paymentservice/provider payment-service/src/test/java/com/restaurant/paymentservice/provider/PaymentProviderRoutingTest.java
git commit -m "feat(payment-service): add provider abstraction and payment transaction model"
```

### Task 3: Implement SePay Create Payment API

**Files:**
- Modify: `payment-service/src/main/java/com/restaurant/paymentservice/controller/PaymentController.java`
- Modify: `payment-service/src/main/java/com/restaurant/paymentservice/service/PaymentService.java`
- Create: `payment-service/src/main/java/com/restaurant/paymentservice/dto/SepayCreatePaymentRequest.java`
- Create: `payment-service/src/main/java/com/restaurant/paymentservice/dto/SepayCreatePaymentResponse.java`
- Create: `payment-service/src/test/java/com/restaurant/paymentservice/controller/SepayCreatePaymentApiTest.java`

**Step 1: Write the failing test**

```java
@Test
void shouldCreateSepayTransactionAndReturnQrInfo() throws Exception {
    mockMvc.perform(post("/api/payments/sepay/create")
            .contentType("application/json")
            .content("{\"order_id\":101,\"table_id\":3,\"table_key\":\"k-123\",\"amount\":120000}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.transaction_ref").isNotEmpty())
        .andExpect(jsonPath("$.status").value("PENDING"));
}
```

**Step 2: Run test to verify it fails**

Run: `..\.maven\apache-maven-3.9.6\bin\mvn.cmd -q -Dtest=SepayCreatePaymentApiTest test`
Expected: FAIL with 404 endpoint not found.

**Step 3: Write minimal implementation**

```java
@PostMapping("/sepay/create")
public ResponseEntity<SepayCreatePaymentResponse> createSepayPayment(@RequestBody SepayCreatePaymentRequest req) {
    return ResponseEntity.ok(paymentService.createSepayPayment(req));
}
```

```java
public SepayCreatePaymentResponse createSepayPayment(SepayCreatePaymentRequest req) {
    // create/update payment_request
    // create payment_transaction with status PENDING
    // call SepayPaymentProvider.createQr(...)
    // persist providerReference/raw payload
    // return transactionRef + qrData + expireAt + amount
}
```

**Step 4: Run test to verify it passes**

Run: `..\.maven\apache-maven-3.9.6\bin\mvn.cmd -q -Dtest=SepayCreatePaymentApiTest test`
Expected: PASS.

**Step 5: Commit**

```bash
git add payment-service/src/main/java/com/restaurant/paymentservice/controller/PaymentController.java payment-service/src/main/java/com/restaurant/paymentservice/service/PaymentService.java payment-service/src/main/java/com/restaurant/paymentservice/dto payment-service/src/test/java/com/restaurant/paymentservice/controller/SepayCreatePaymentApiTest.java
git commit -m "feat(payment-service): add SePay create payment endpoint"
```

### Task 4: Implement Webhook Validation and Idempotent Status Transition

**Files:**
- Modify: `payment-service/src/main/java/com/restaurant/paymentservice/controller/PaymentController.java`
- Create: `payment-service/src/main/java/com/restaurant/paymentservice/dto/SepayWebhookPayload.java`
- Modify: `payment-service/src/main/java/com/restaurant/paymentservice/service/PaymentService.java`
- Create: `payment-service/src/test/java/com/restaurant/paymentservice/service/SepayWebhookProcessingTest.java`

**Step 1: Write the failing test**

```java
@Test
void shouldBeIdempotentWhenDuplicatePaidWebhookArrives() {
    // given transaction in PAID
    // when process same PAID webhook again
    // then no extra payment record and no duplicate order-service call
}
```

**Step 2: Run test to verify it fails**

Run: `..\.maven\apache-maven-3.9.6\bin\mvn.cmd -q -Dtest=SepayWebhookProcessingTest test`
Expected: FAIL because webhook service logic is missing.

**Step 3: Write minimal implementation**

```java
@PostMapping("/sepay/webhook")
public ResponseEntity<Map<String, Object>> sepayWebhook(
        @RequestBody String raw,
        @RequestHeader("X-SePay-Signature") String signature) {
    return ResponseEntity.ok(paymentService.processSepayWebhook(raw, signature));
}
```

```java
@Transactional
public Map<String, Object> processSepayWebhook(String rawPayload, String signature) {
    // validate signature
    // find tx by providerReference/transactionRef
    // if already PAID -> return idempotent ack
    // if valid paid transition from PENDING -> PAID and sync order-service once
}
```

**Step 4: Run test to verify it passes**

Run: `..\.maven\apache-maven-3.9.6\bin\mvn.cmd -q -Dtest=SepayWebhookProcessingTest test`
Expected: PASS.

**Step 5: Commit**

```bash
git add payment-service/src/main/java/com/restaurant/paymentservice/controller/PaymentController.java payment-service/src/main/java/com/restaurant/paymentservice/service/PaymentService.java payment-service/src/main/java/com/restaurant/paymentservice/dto/SepayWebhookPayload.java payment-service/src/test/java/com/restaurant/paymentservice/service/SepayWebhookProcessingTest.java
git commit -m "feat(payment-service): process SePay webhook with signature and idempotency"
```

### Task 5: Implement Timeout + Paid-Pending-Sync Retry + Admin Refund Marker APIs

**Files:**
- Modify: `payment-service/src/main/java/com/restaurant/paymentservice/service/PaymentService.java`
- Create: `payment-service/src/main/java/com/restaurant/paymentservice/job/PaymentTransactionScheduler.java`
- Modify: `payment-service/src/main/java/com/restaurant/paymentservice/controller/PaymentController.java`
- Create: `payment-service/src/test/java/com/restaurant/paymentservice/job/PaymentTransactionSchedulerTest.java`
- Create: `payment-service/src/test/java/com/restaurant/paymentservice/controller/SepayAdminApiTest.java`

**Step 1: Write the failing test**

```java
@Test
void shouldMarkPendingTransactionExpiredWhenPastExpireAt() {
    // given pending tx with expireAt in past
    // when scheduler runs
    // then status becomes EXPIRED
}
```

**Step 2: Run test to verify it fails**

Run: `..\.maven\apache-maven-3.9.6\bin\mvn.cmd -q -Dtest=PaymentTransactionSchedulerTest test`
Expected: FAIL because scheduler/job logic does not exist.

**Step 3: Write minimal implementation**

```java
@Scheduled(fixedDelayString = "${payment.tx.timeout-check-ms:30000}")
public void expirePendingTransactions() {
    // update PENDING -> EXPIRED when expireAt < now
}
```

```java
@PostMapping("/sepay/{transactionRef}/mark-refund-handled")
public ResponseEntity<Map<String, Object>> markRefundHandled(...) {
    // set refundedManual=true, refundedBy, refundedAt, refundNote
}
```

**Step 4: Run test to verify it passes**

Run:
- `..\.maven\apache-maven-3.9.6\bin\mvn.cmd -q -Dtest=PaymentTransactionSchedulerTest test`
- `..\.maven\apache-maven-3.9.6\bin\mvn.cmd -q -Dtest=SepayAdminApiTest test`
Expected: PASS.

**Step 5: Commit**

```bash
git add payment-service/src/main/java/com/restaurant/paymentservice/service/PaymentService.java payment-service/src/main/java/com/restaurant/paymentservice/job/PaymentTransactionScheduler.java payment-service/src/main/java/com/restaurant/paymentservice/controller/PaymentController.java payment-service/src/test/java/com/restaurant/paymentservice/job/PaymentTransactionSchedulerTest.java payment-service/src/test/java/com/restaurant/paymentservice/controller/SepayAdminApiTest.java
git commit -m "feat(payment-service): add timeout/retry and admin manual refund handling"
```

### Task 6: Route New Endpoints Through API Gateway

**Files:**
- Modify: `api-gateway/src/main/resources/application.yml`
- Modify: `api-gateway/src/main/resources/application-local.yml`
- Create: `api-gateway/src/test/resources/sepay-gateway-routes-smoke.md`

**Step 1: Write the failing test**

```text
Manual route smoke (documented):
- /api/payments/sepay/create not routed yet
- /api/payments/sepay/webhook not routed yet
```

**Step 2: Run test to verify it fails**

Run: `rg -n "Path=/api/payments/sepay" api-gateway/src/main/resources/application*.yml`
Expected: no match.

**Step 3: Write minimal implementation**

```yaml
- id: payment-service
  uri: ${PAYMENT_SERVICE_URL:http://localhost:3008}
  predicates:
    - Path=/api/payments/**
```

(ensure SePay endpoints are covered and no conflicting route order)

**Step 4: Run test to verify it passes**

Run: `rg -n "Path=/api/payments/\*\*" api-gateway/src/main/resources/application*.yml`
Expected: match exists and route remains valid for old cash endpoints.

**Step 5: Commit**

```bash
git add api-gateway/src/main/resources/application.yml api-gateway/src/main/resources/application-local.yml api-gateway/src/test/resources/sepay-gateway-routes-smoke.md
git commit -m "chore(api-gateway): confirm routing for SePay payment endpoints"
```

### Task 7: Add Customer SePay Flow in Table-Service Frontend

**Files:**
- Modify: `table-service/src/main/resources/static/js/app.js`
- Modify: `table-service/src/main/resources/static/js/config.js`
- Create: `table-service/src/main/resources/static/js/payment-sepay.js`
- Create: `table-service/src/test/resources/manual-sepay-customer-smoke.md`

**Step 1: Write the failing test**

```text
Manual failing scenario:
- Open payment modal
- Choose SePay
- No QR is displayed and no status polling/subscription for transaction_ref
```

**Step 2: Run test to verify it fails**

Run: start app in local and execute checklist in `manual-sepay-customer-smoke.md`
Expected: SePay option missing or non-functional.

**Step 3: Write minimal implementation**

```javascript
// payment-sepay.js
export async function createSepayPayment(payload) {
  return fetchJson('/api/payments/sepay/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
```

```javascript
// app.js
// add method selector cash|sepay
// render QR when method === 'sepay'
// subscribe websocket and update modal state on PENDING/PAID/EXPIRED
```

**Step 4: Run test to verify it passes**

Run: execute `manual-sepay-customer-smoke.md` again
Expected: customer can choose SePay, see QR, and observe status transition in UI.

**Step 5: Commit**

```bash
git add table-service/src/main/resources/static/js/app.js table-service/src/main/resources/static/js/config.js table-service/src/main/resources/static/js/payment-sepay.js table-service/src/test/resources/manual-sepay-customer-smoke.md
git commit -m "feat(table-service): add customer SePay payment UI flow"
```

### Task 8: Add Admin SePay Monitoring and Manual Refund Marker UI

**Files:**
- Create: `Fe-Admin/app/payments/page.tsx`
- Create: `Fe-Admin/app/payments/layout.tsx`
- Modify: `Fe-Admin/app/layout.tsx`
- Create: `Fe-Admin/src/lib/sepay.ts`
- Create: `Fe-Admin/docs/manual-sepay-admin-smoke.md`

**Step 1: Write the failing test**

```text
Manual failing scenario:
- Admin cannot open a SePay transaction list page.
- No action to mark manual refund handled.
```

**Step 2: Run test to verify it fails**

Run: `npm run build` (in `Fe-Admin`) after creating empty `app/payments/page.tsx`
Expected: route not implemented or compile error.

**Step 3: Write minimal implementation**

```tsx
// app/payments/page.tsx
export default function PaymentsPage() {
  // fetch /api/payments/sepay/transactions
  // filter by status and keyword
  // button -> POST /api/payments/sepay/{transactionRef}/mark-refund-handled
  return <main>SePay Transactions</main>;
}
```

**Step 4: Run test to verify it passes**

Run:
- `npm run lint`
- `npm run build`
Expected: PASS, `/payments` renders and manual smoke checklist works.

**Step 5: Commit**

```bash
git add Fe-Admin/app/payments/page.tsx Fe-Admin/app/payments/layout.tsx Fe-Admin/app/layout.tsx Fe-Admin/src/lib/sepay.ts Fe-Admin/docs/manual-sepay-admin-smoke.md
git commit -m "feat(fe-admin): add SePay monitoring and manual refund handled action"
```

### Task 9: Configure Environment and Final Verification

**Files:**
- Modify: `payment-service/src/main/resources/application.yml`
- Modify: `payment-service/src/main/resources/application-local.yml` (create if missing)
- Modify: `docs/plans/2026-04-08-sepay-integration-design.md`
- Create: `docs/plans/2026-04-08-sepay-integration-test-checklist.md`

**Step 1: Write the failing test**

```text
Failing checklist:
- Missing SEPAY_* env values causes startup/runtime failures.
- End-to-end cannot complete paid flow from QR to order completion.
```

**Step 2: Run test to verify it fails**

Run:
- backend startup without SEPAY envs
- try create SePay transaction via API
Expected: controlled validation error showing missing config.

**Step 3: Write minimal implementation**

```yaml
payment:
  sepay:
    api-key: ${SEPAY_API_KEY:}
    secret: ${SEPAY_WEBHOOK_SECRET:}
    base-url: ${SEPAY_BASE_URL:https://api.sepay.vn}
    return-url: ${SEPAY_RETURN_URL:}
    timeout-minutes: ${SEPAY_TIMEOUT_MINUTES:15}
```

Add startup validation with clear error messages for required production vars.

**Step 4: Run test to verify it passes**

Run:
- `..\.maven\apache-maven-3.9.6\bin\mvn.cmd -q -DskipTests package` for `payment-service`
- `npm run build` for `Fe-Admin`
- execute `docs/plans/2026-04-08-sepay-integration-test-checklist.md`
Expected: all checklist items pass for happy path, duplicate webhook, expiry, late paid webhook.

**Step 5: Commit**

```bash
git add payment-service/src/main/resources/application.yml payment-service/src/main/resources/application-local.yml docs/plans/2026-04-08-sepay-integration-design.md docs/plans/2026-04-08-sepay-integration-test-checklist.md
git commit -m "docs+config: finalize SePay env config and E2E verification checklist"
```

## Notes for Execution

- Keep commits small, one task per commit.
- Do not alter existing cash endpoint contracts.
- Preserve idempotency and auditability as first-class requirements.
- Manual refund marker is required; automatic refund via provider API remains out-of-scope unless explicitly approved later.
