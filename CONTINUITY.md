Goal (incl. success criteria):
- Tắt tự động reload/refresh ở các trang admin (loại bỏ polling/interval).
- Keep SePay flow continuity context preserved in ledger.

Constraints/Assumptions:
- Explicitly apply `rule/continuity-ledger-rule.mdc` on every user request.
- Apply rules under `C:\Users\yasuo\Desktop\restaurant-server\rule` every turn.
- Update this ledger every turn; replies begin with Ledger Snapshot.
- Work only within `C:\Users\yasuo\Desktop\restaurant-server`.
- Replies are in Vietnamese.
- Do not run DB/migration/server commands autonomously.

Key decisions:
- Chỉ tắt polling/interval; socket realtime giữ nguyên.

State:
  - Done:
    - Đã tắt polling/interval ở dashboard/tables/reservations/orders/kitchen/payments/cashier (chưa commit/push).
  - Now:
    - Chờ xác nhận commit/push.
  - Next:
    - Commit/push nếu người dùng yêu cầu.

Open questions (`UNCONFIRMED` if needed):
- UNCONFIRMED: Có cần tắt cả socket realtime không?

Working set (files/ids/commands):
- `CONTINUITY.md`
- `Fe-Admin/app/dashboard/page.tsx`
- `Fe-Admin/app/tables/page.tsx`
- `Fe-Admin/app/reservations/page.tsx`
- `Fe-Admin/app/orders/page.tsx`
- `Fe-Admin/app/kitchen/page.tsx`
- `Fe-Admin/app/payments/page.tsx`
- `Fe-Admin/app/cashier/page.tsx`
