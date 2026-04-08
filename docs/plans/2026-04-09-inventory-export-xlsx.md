# Inventory Export XLSX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add client-side XLSX export for inventory with two options (Toàn kho / Sắp hết hàng) and correct filename format.

**Architecture:** Implement in FE Admin inventory page; use `xlsx` to generate workbook from current UI data and trigger download.

**Tech Stack:** Next.js (App Router), React, TypeScript, shadcn/ui, `xlsx`.

---

### Task 1: Add XLSX dependency (if missing)

**Files:**
- Modify: `Fe-Admin/package.json`

**Step 1: Add dependency**

```bash
cd Fe-Admin
npm install xlsx
```

**Step 2: Verify package.json update**

Ensure `xlsx` appears in `dependencies`.

**Step 3: Commit**

```bash
git add Fe-Admin/package.json Fe-Admin/package-lock.json

git commit -m "chore(inventory): add xlsx dependency"
```

---

### Task 2: Add export utilities to inventory page

**Files:**
- Modify: `Fe-Admin/app/inventory/page.tsx`

**Step 1: Write the failing test**

If no test harness for FE, skip to Step 3.

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL

**Step 3: Write minimal implementation**

Add helpers:

```ts
import * as XLSX from "xlsx";

const formatDateYYYYMMDD = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
};

const exportInventoryXlsx = (rows: InventoryItem[], mode: "all" | "low") => {
  const data = rows.map((item) => ({
    ID: item.id,
    "Tên nguyên liệu": item.name,
    "Đơn vị": item.unit_name || item.unit || "",
    "Số lượng tồn": item.quantity,
  }));

  if (!data.length) {
    toast.error("Không có dữ liệu để xuất");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Kho");

  const suffix = formatDateYYYYMMDD();
  const filename = mode === "low"
    ? `kho-sap-het-${suffix}.xlsx`
    : `kho-${suffix}.xlsx`;

  XLSX.writeFile(wb, filename);
};
```

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add Fe-Admin/app/inventory/page.tsx

git commit -m "feat(inventory): add xlsx export helpers"
```

---

### Task 3: Add UI control for export

**Files:**
- Modify: `Fe-Admin/app/inventory/page.tsx`

**Step 1: Write the failing test**

If no test harness, skip.

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL

**Step 3: Write minimal implementation**

- Add a `Xuất Excel` button near search/Thêm mới.
- On click, open dropdown with two actions:
  - `Toàn kho` → call `exportInventoryXlsx(allItems, "all")`
  - `Sắp hết hàng` → call `exportInventoryXlsx(lowStockItems, "low")`

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add Fe-Admin/app/inventory/page.tsx

git commit -m "feat(inventory): add export button"
```

---

### Task 4: Manual verification

**Step 1: Run app**

Run: `npm run dev` (in `Fe-Admin`)

**Step 2: Verify**
- Export Toàn kho creates `kho-YYYYMMDD.xlsx`
- Export Sắp hết hàng creates `kho-sap-het-YYYYMMDD.xlsx`
- Columns match table
- Empty list shows toast

**Step 3: Commit (if any)**

```bash
git add Fe-Admin/app/inventory/page.tsx

git commit -m "chore(inventory): verify export"
```
