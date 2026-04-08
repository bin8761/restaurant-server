Goal (incl. success criteria):
- Bếp hiển thị được món ở trạng thái "Đang nấu" (mapping status) thay vì rỗng.
- Keep SePay flow continuity context preserved in ledger.

Constraints/Assumptions:
- Explicitly apply `rule/continuity-ledger-rule.mdc` on every user request.
- Apply rules under `C:\Users\yasuo\Desktop\restaurant-server\rule` every turn.
- Update this ledger every turn; replies begin with Ledger Snapshot.
- Work only within `C:\Users\yasuo\Desktop\restaurant-server`.
- Replies are in Vietnamese.
- Do not run DB/migration/server commands autonomously.

Key decisions:
- Normalize trạng thái bếp để map "Đang nấu/Đang chế biến/Đang làm" -> cooking.

State:
  - Done:
    - Auto refresh đã tắt ở admin theo yêu cầu trước đó.
  - Now:
    - Đã thêm normalize status và sửa filter/badge ở bếp (chưa commit/push).
  - Next:
    - Commit/push nếu người dùng yêu cầu.

Open questions (`UNCONFIRMED` if needed):
- UNCONFIRMED: Có muốn đổi nhãn hiển thị thành "Đang nấu" thay vì "Đang chế biến" không?

Working set (files/ids/commands):
- `CONTINUITY.md`
- `Fe-Admin/app/kitchen/page.tsx`
