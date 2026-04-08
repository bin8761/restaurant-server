Goal (incl. success criteria):
- SePay payment flow on Railway: create QR, receive webhook, transaction status moves from `PENDING` to `PAID`, admin view updates.
- Deployment goal (secondary): all services deployable on Railway (pilot done).

Constraints/Assumptions:
- Apply rules under `C:\Users\yasuo\Desktop\restaurant-server\rule` every turn.
- Update this ledger every turn; replies begin with Ledger Snapshot.
- Work only within `C:\Users\yasuo\Desktop\restaurant-server`.
- Replies are in Vietnamese.
- Do not run DB/migration/server commands autonomously.

Key decisions:
- Provider-based approach in `payment-service` for `cash` + `sepay` (no new microservice).
- SePay runs alongside cash; sandbox is acceptable for now.
- Use direct VietQR fallback when SePay API create fails (current runtime state).

State:
  - Done:
    - Multiple fixes already pushed to `origin/main` for SePay create + fallback QR + webhook auth.
    - Latest critical fixes:
      - `e0e3b7c`: VietinBank transfer content uses `SEVQR SP...` in direct QR fallback.
      - `5de0d2d`: webhook auth accepts `Api_Key` headers.
      - `ccbc373`: webhook fallback mapping by `amount + recent time` when `transaction_ref` missing.
    - Webhook is reaching backend (log shows `SePay webhook received`), but mapping failed due to missing `transaction_ref`.
    - Additional local patch (chua deploy):
      - `PaymentService.findTransaction(...)` now:
        - scans full webhook payload recursively to extract `SP...` ref.
        - adds safer fallback: if amount missing and only one pending tx -> map that tx.
        - amount fallback now returns newest candidate instead of dropping as ambiguous.
      - amount extraction supports extra keys: `transferAmountIn`, `transfer_amount_in`, `totalAmount`.
      - added recursive amount scan with key-based guard (tranh bat nham so tham chieu).
      - repository added `findTop20ByProviderAndStatusInOrderByCreatedAtDesc(...)`.
      - Fixed critical bug in webhook mapping:
        - previously if webhook had `providerReference` but DB did not match, code returned `null` immediately.
        - now it logs and continues to fallback mapping (`SP...` recursive / amount / recent pending).
      - Added webhook status inference:
        - if SePay webhook lacks explicit status but indicates incoming-money event and positive amount, infer `PAID`.
  - Now:
    - SQL in Railway Data tab is now running successfully when query is clean (khong dính `LIMIT 100` ghost).
    - Current DB result: 12/12 giao dich `EXPIRED`; `provider_reference` are `direct-*` or `mock-*`.
    - `raw_webhook_payload IS NOT NULL` currently returns `0 rows` for listed rows.
  - Next:
    - Deploy latest local patch from `payment-service` (webhook recursive mapping).
    - Create 1 new SePay transaction and transfer with exact `SEVQR SP...`.
    - Recheck:
      - `/api/payments/sepay/{txRef}/status` becomes `PAID`.
      - `raw_webhook_payload` saved for that row.
      - order session closed automatically.

Open questions (UNCONFIRMED if needed):
- Will SePay webhook payload include transfer content containing `SP...` for the new tx?
- After new patch deploy, does webhook map by recursive `SP...` extraction or pending fallback?

Working set (files/ids/commands):
- `CONTINUITY.md`
- `payment-service/src/main/java/com/restaurant/paymentservice/service/PaymentService.java`
- `payment-service/src/main/java/com/restaurant/paymentservice/provider/SepayPaymentProvider.java`
- `payment-service/src/main/java/com/restaurant/paymentservice/provider/SepaySignatureVerifier.java`
- `payment-service/src/main/java/com/restaurant/paymentservice/controller/PaymentController.java`
- `payment-service/src/main/java/com/restaurant/paymentservice/repository/PaymentTransactionRepository.java`
