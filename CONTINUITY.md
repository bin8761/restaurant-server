Goal (incl. success criteria):
- Thêm xuất XLSX cho kho (Toàn kho / Sắp hết hàng), cột theo bảng hiện tại, tên file theo mẫu đã chốt.
- Keep SePay flow continuity context preserved in ledger.

Constraints/Assumptions:
- Explicitly apply `rule/continuity-ledger-rule.mdc` on every user request.
- Apply rules under `C:\Users\yasuo\Desktop\restaurant-server\rule` every turn.
- Update this ledger every turn; replies begin with Ledger Snapshot.
- Work only within `C:\Users\yasuo\Desktop\restaurant-server`.
- Do not run DB/migration/server commands autonomously.

Key decisions:
- Xuất XLSX phía client bằng `xlsx`.
- Hai lựa chọn: Toàn kho / Sắp hết hàng.
- Tên file: `kho-YYYYMMDD.xlsx` và `kho-sap-het-YYYYMMDD.xlsx`.

State:
  - Done:
    - Design + implementation plan đã được commit.
  - Now:
    - Đã thêm nút Xuất Excel và logic tạo file XLSX (chưa commit/push).
  - Next:
    - Commit/push nếu người dùng yêu cầu.

Open questions (`UNCONFIRMED` if needed):
- UNCONFIRMED: None.

Working set (files/ids/commands):
- `CONTINUITY.md`
- `Fe-Admin/app/inventory/page.tsx`
- `Fe-Admin/package.json`
- `Fe-Admin/package-lock.json`
