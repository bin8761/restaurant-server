Goal (incl. success criteria):
- Đổi luồng thanh toán: bấm "Thanh toán" sẽ gọi SePay và tạo QR ngay, không chọn phương thức, không cần nút tạo QR.
- Cập nhật nhãn nút/ghi chú phù hợp và đảm bảo tiếng Việt có dấu.
- Keep SePay flow continuity context preserved in ledger.

Constraints/Assumptions:
- Explicitly apply `rule/continuity-ledger-rule.mdc` on every user request.
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
    - SePay continuity and patches recorded from previous sessions (unchanged).
    - Customer UI layout fix already pushed (commit `fb8b8ea`).
    - Updated navbar brand link to always point to `/menu/`.
    - Committed and pushed navbar change:
      - Commit: `bbb16ae`
      - Message: `fix(navbar): always route brand link to /menu`
    - Adjusted QR page image availability check to tolerate HEAD-blocked image servers.
    - Committed and pushed QR image fix:
      - Commit: `04acf3e`
      - Message: `fix(qr-ui): allow images when head is blocked`
    - Committed and pushed QR UI copy changes:
      - Commit: `6bd0f87`
      - Message: `fix(qr-ui): update toast text and cart label`
    - Committed and pushed cart label/button text changes:
      - Commit: `c4d49a8`
      - Message: `fix(qr-ui): rename cart labels and add button text`
    - Committed and pushed đổi "Đơn hàng" -> "Hóa đơn":
      - Commit: `9c297a2`
      - Message: `fix(qr-ui): rename order labels to invoice`
    - Đã cập nhật toàn bộ chuỗi hiển thị sang tiếng Việt có dấu trong `app.js`.
    - Đã thêm CSS mobile để header hiển thị rõ thông tin bàn.
  - Now:
    - Đang chuyển luồng thanh toán sang SePay-only và tự tạo QR khi mở modal (chưa commit/push).
  - Next:
    - Commit/push nếu người dùng yêu cầu.

Open questions (`UNCONFIRMED` if needed):
- UNCONFIRMED: None.

Working set (files/ids/commands):
- `CONTINUITY.md`
- `rule/continuity-ledger-rule.mdc`
- `table-service/src/main/resources/static/js/app.js`
- `table-service/src/main/resources/static/index.html`
