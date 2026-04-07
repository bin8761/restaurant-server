# SePay Integration Design (Restaurant Server)

Date: 2026-04-08
Status: Approved (Design phase)

## 1. Scope and Success Criteria

- Integrate SePay as a new payment method in parallel with existing cash flow.
- Keep current cash flow operational without breaking existing API contracts.
- Cover full stack scope:
  - Backend: payment provider integration, webhook, verification, timeout, idempotency.
  - Customer UI (`table-service` static frontend): select SePay, display QR/payment status.
  - Admin UI (`Fe-Admin`): monitor SePay transactions and mark manual refund handled.
- Admin operation level is fixed at Level 2:
  - Monitoring + manual refund-handled marker for late-paid/expired cases.

## 2. Architecture

### 2.1 Chosen Approach

Approach A (selected): extend existing `payment-service` using provider-based design (`cash` + `sepay`) without adding a new microservice.

### 2.2 Components

- `payment-service`
  - Introduce `PaymentProvider` abstraction.
  - Keep `CashPaymentProvider` aligned with current behavior.
  - Add `SePayPaymentProvider` for:
    - create QR/payment link,
    - verify transaction,
    - webhook signature validation and status mapping.
  - Add transaction domain model for provider-specific lifecycle.
- `api-gateway`
  - Route new SePay API paths and webhook callback path to `payment-service`.
- `table-service` frontend
  - Add payment method selection (`cash`/`sepay`).
  - Render SePay QR and realtime payment status.
- `Fe-Admin`
  - Add SePay transaction monitoring screen.
  - Add action to mark manual refund handled.

### 2.3 Compatibility Strategy

- Existing cash endpoints remain supported.
- Existing order completion/session logic remains central in `payment-service`.
- Provider routing is additive and backward-compatible.

## 3. Data Model and State Invariants

### 3.1 Core Entities

- `payment_requests` (existing): request-level intent per order/session.
- `payments` (existing): completed payment record.
- New provider transaction entity (proposed): `payment_transactions`
  - `id`
  - `order_id`
  - `payment_request_id`
  - `provider` (`cash` | `sepay`)
  - `transaction_ref` (internal unique reference)
  - `provider_reference` (SePay reference/transaction id)
  - `status` (`PENDING` | `PAID` | `FAILED` | `EXPIRED` | `PAID_PENDING_SYNC`)
  - `amount`
  - `expire_at`
  - `paid_at`
  - `refund_required_manual` (bool)
  - `refunded_manual` (bool)
  - `refunded_by`, `refunded_at`, `refund_note`
  - `raw_create_payload`, `raw_webhook_payload`
  - timestamps

### 3.2 Invariants

- Only payable requests/orders are allowed to start SePay transaction.
- A paid transaction must not be processed twice.
- Duplicate webhook for already paid transaction returns idempotent success (no extra side effect).
- Timeout moves pending transaction to expired.
- Late paid webhook after expiry keeps payment as paid but sets manual refund-required marker.

## 4. Data Flow

1. Customer chooses SePay in `table-service`.
2. Frontend calls create-payment endpoint in `payment-service`.
3. `payment-service` creates/updates `payment_request` and creates `payment_transaction` as `PENDING`.
4. `SePayPaymentProvider` creates QR/payment instruction via SePay API.
5. Service returns `transaction_ref`, payment QR data, amount, and expiry.
6. Frontend displays QR and listens websocket updates.
7. SePay sends webhook callback.
8. `payment-service` validates signature and resolves transaction by reference.
9. Service updates status idempotently:
   - `PENDING` -> `PAID` on valid paid webhook.
   - already `PAID` -> ack without reprocessing.
10. On paid success, service completes order/session via `order-service`.
11. Service emits websocket events (`payment_status_updated`/`payment_completed`).
12. Scheduler marks overdue `PENDING` transactions as `EXPIRED`.
13. Late-paid after expiry sets `refund_required_manual = true` and is visible in admin.
14. Admin marks manual refund handled when completed offline.

## 5. Error Handling

- Invalid webhook signature: reject request (401/403), no state mutation.
- Duplicate webhook: return idempotent success, no duplicate order completion.
- Unknown transaction reference: log unmatched webhook for investigation.
- Provider timeout/5xx on QR creation: return retriable error, avoid invalid paid state.
- Order sync failure after paid webhook:
  - transaction becomes `PAID_PENDING_SYNC`,
  - retry sync job handles eventual consistency.
- Concurrency/race:
  - unique constraints on provider reference,
  - conditional status update (`PENDING` only) for paid transitions.

## 6. Testing Strategy

### 6.1 Unit Tests

- SePay provider create/verify/signature logic.
- Idempotent webhook processor.
- Timeout scheduler state transitions.

### 6.2 Integration Tests

- Create QR -> webhook paid -> order completion.
- Duplicate webhook should not duplicate side effects.
- Paid but order sync fail -> `PAID_PENDING_SYNC` then retry recovery.
- Late webhook after expiry -> `refund_required_manual=true`.

### 6.3 UI Tests

- Customer UI can choose SePay and receives realtime status updates.
- Existing cash flow remains functional.
- Admin list/filter/mark manual refund handled.

### 6.4 Non-functional Tests

- Concurrent webhook delivery against same transaction.
- Audit logs contain trace fields (`transaction_ref`, `provider_reference`, `order_id`).
- Metrics for paid/failed/expired/late-paid/manual-refund-required.

## 7. API Surface (Planned)

- Customer/Frontend
  - `POST /api/payments/sepay/create`
  - `GET /api/payments/sepay/{transactionRef}/status`
- Provider callback
  - `POST /api/payments/sepay/webhook`
- Admin
  - `GET /api/payments/sepay/transactions`
  - `POST /api/payments/sepay/{transactionRef}/mark-refund-handled`
- Internal operation
  - scheduler/worker endpoint or internal job for timeout and sync retries.

## 8. Security and Observability

- Webhook signature validation is mandatory before processing payload.
- Persist raw webhook payload for audit/debug (with sensitive-field redaction if needed).
- Structured logging fields: `transaction_ref`, `provider_reference`, `order_id`, `status_before`, `status_after`.
- Expose operational metrics for monitoring and alerting.

## 9. Open Questions

- UNCONFIRMED: whether to implement automatic refund API flow with provider now, or keep manual refund marker only.
- UNCONFIRMED: final production secret rotation process for SePay credentials.

## 10. Rollout Plan (High-level)

1. Add provider abstraction and SePay transaction model in `payment-service`.
2. Add SePay endpoints and webhook path through gateway.
3. Add customer SePay UI flow in `table-service`.
4. Add admin monitoring + manual refund marker UI in `Fe-Admin`.
5. Validate via integration tests and staged environment rollout.
