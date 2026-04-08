Goal (incl. success criteria):
- Chỉnh UI mục SePay: ẩn Transaction Ref, ẩn hoàn tiền thủ công/thao tác/ghi chú, ẩn dòng mô tả theo dõi giao dịch.
- Mapping trạng thái sang văn nói dễ hiểu; thời gian hiển thị đúng múi giờ Việt Nam (HH:mm:ss dd/MM/yyyy); tìm kiếm chỉ theo Order ID (#123 hoặc 123) và bỏ placeholder.
- Keep SePay flow continuity context preserved in ledger.

Constraints/Assumptions:
- Explicitly apply `rule/continuity-ledger-rule.mdc` on every user request.
- Apply rules under `C:\Users\yasuo\Desktop\restaurant-server\rule` every turn.
- Update this ledger every turn; replies begin with Ledger Snapshot.
- Work only within `C:\Users\yasuo\Desktop\restaurant-server`.
- Replies are in Vietnamese.
- Do not run DB/migration/server commands autonomously.

Key decisions:
- Status mapping: PENDING=Chờ thanh toán, PAID=Đã thanh toán, FAILED=Thất bại, EXPIRED=Hết hạn, PAID_PENDING_SYNC=Đã thanh toán (đang đồng bộ), ALL=Tất cả.

State:
  - Done:
    - Design + implementation plan cho UI SePay đã ghi vào docs.
  - Now:
    - Đã chỉnh UI SePay trong FE-Admin (chưa commit/push).
  - Next:
    - Commit/push nếu người dùng yêu cầu.

Open questions (`UNCONFIRMED` if needed):
- UNCONFIRMED: None.

Working set (files/ids/commands):
- `CONTINUITY.md`
- `Fe-Admin/app/payments/page.tsx`
- `docs/plans/2026-04-08-sepay-ui-design.md`
- `docs/plans/2026-04-08-sepay-ui.md`
