Goal (incl. success criteria):
- Tắt tự động reload/refresh ở admin và đảm bảo trang Đơn hàng không bị lọc rỗng do mặc định theo ngày.
- Keep SePay flow continuity context preserved in ledger.

Constraints/Assumptions:
- Explicitly apply `rule/continuity-ledger-rule.mdc` on every user request.
- Apply rules under `C:\Users\yasuo\Desktop\restaurant-server\rule` every turn.
- Update this ledger every turn; replies begin with Ledger Snapshot.
- Work only within `C:\Users\yasuo\Desktop\restaurant-server`.
- Replies are in Vietnamese.
- Do not run DB/migration/server commands autonomously.

Key decisions:
- Mặc định không lọc theo ngày để tránh rỗng dữ liệu khi qua ngày mới.

State:
  - Done:
    - Đã tắt polling/interval ở các trang admin trước đó.
  - Now:
    - Đã bỏ default filterDate ở trang Đơn hàng (chưa commit/push).
  - Next:
    - Commit/push nếu người dùng yêu cầu.

Open questions (`UNCONFIRMED` if needed):
- UNCONFIRMED: Có muốn giữ bộ lọc ngày với nút xóa nhanh không?

Working set (files/ids/commands):
- `CONTINUITY.md`
- `Fe-Admin/app/orders/page.tsx`
