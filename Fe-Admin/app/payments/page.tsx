"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSepayTransactions, type SepayTransaction } from "@/lib/sepay";

const STATUS_OPTIONS = ["ALL", "PENDING", "PAID", "FAILED", "EXPIRED", "PAID_PENDING_SYNC"];
const STATUS_LABELS: Record<string, string> = {
  ALL: "Tất cả",
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  EXPIRED: "Hết hạn",
  PAID_PENDING_SYNC: "Đã thanh toán (đang đồng bộ)",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount || 0));

const formatVnDateTime = (value?: string | number | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("hour")}:${get("minute")}:${get("second")} ${get("day")}/${get("month")}/${get("year")}`;
};

const mapStatusLabel = (status?: string | null) => {
  if (!status) return "Không xác định";
  return STATUS_LABELS[status.toUpperCase()] ?? "Không xác định";
};

const normalizeOrderIdQuery = (value: string) => value.trim().replace(/^#/, "");

const statusColor = (status: string) => {
  switch ((status || "").toUpperCase()) {
    case "PAID":
      return "default" as const;
    case "PENDING":
      return "secondary" as const;
    case "FAILED":
    case "EXPIRED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

export default function PaymentsPage() {
  const [status, setStatus] = useState("ALL");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");

  const swrKey = useMemo(() => ["sepay-transactions", status, query], [status, query]);

  const { data, isLoading } = useSWR<SepayTransaction[]>(
    swrKey,
    () => listSepayTransactions(status === "ALL" ? undefined : status, query || undefined),
    { refreshInterval: 10000 }
  );

  const normalizedQuery = useMemo(() => normalizeOrderIdQuery(query), [query]);
  const filteredData = useMemo(() => {
    if (!data) return data;
    if (!normalizedQuery) return data;
    return data.filter((tx) => String(tx.order_id) === normalizedQuery);
  }, [data, normalizedQuery]);

  const handleSearch = () => {
    setQuery(normalizeOrderIdQuery(queryInput));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch SePay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt}
                type="button"
                size="sm"
                variant={status === opt ? "default" : "outline"}
                onClick={() => setStatus(opt)}
              >
                {STATUS_LABELS[opt]}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
            />
            <Button type="button" onClick={handleSearch}>Tìm</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4}>Đang tải...</TableCell></TableRow>
              ) : !filteredData || filteredData.length === 0 ? (
                <TableRow><TableCell colSpan={4}>Không có giao dịch phù hợp</TableCell></TableRow>
              ) : (
                filteredData.map((tx) => (
                  <TableRow key={tx.transaction_ref}>
                    <TableCell>#{tx.order_id}</TableCell>
                    <TableCell>{formatCurrency(tx.amount)}</TableCell>
                    <TableCell><Badge variant={statusColor(tx.status)}>{mapStatusLabel(tx.status)}</Badge></TableCell>
                    <TableCell>{formatVnDateTime(tx.paid_at || tx.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
