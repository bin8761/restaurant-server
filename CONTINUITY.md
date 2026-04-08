Goal (incl. success criteria):
- Bổ sung Enter để chạy tìm kiếm ở SePay.
- Keep SePay flow continuity context preserved in ledger.

Constraints/Assumptions:
- Explicitly apply `rule/continuity-ledger-rule.mdc` on every user request.
- Apply rules under `C:\Users\yasuo\Desktop\restaurant-server\rule` every turn.
- Update this ledger every turn; replies begin with Ledger Snapshot.
- Work only within `C:\Users\yasuo\Desktop\restaurant-server`.
- Replies are in Vietnamese.
- Do not run DB/migration/server commands autonomously.

Key decisions:
- Search chỉ theo Order ID, hỗ trợ #123 và 123; Enter phải kích hoạt tìm.

State:
  - Done:
    - UI SePay đã được đơn giản hóa theo yêu cầu trước đó.
  - Now:
    - Đã thêm Enter để chạy tìm kiếm (chưa commit/push).
  - Next:
    - Commit/push nếu người dùng yêu cầu.

Open questions (`UNCONFIRMED` if needed):
- UNCONFIRMED: None.

Working set (files/ids/commands):
- `CONTINUITY.md`
- `Fe-Admin/app/payments/page.tsx`
