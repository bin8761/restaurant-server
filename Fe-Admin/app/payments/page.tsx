"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { listSepayTransactions, markRefundHandled, type SepayTransaction } from "@/lib/sepay";

const STATUS_OPTIONS = ["ALL", "PENDING", "PAID", "FAILED", "EXPIRED", "PAID_PENDING_SYNC"];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount || 0));

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
};

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
  const [note, setNote] = useState("");
  const [processingRef, setProcessingRef] = useState<string | null>(null);

  const swrKey = useMemo(() => ["sepay-transactions", status, query], [status, query]);

  const { data, mutate, isLoading } = useSWR<SepayTransaction[]>(
    swrKey,
    () => listSepayTransactions(status === "ALL" ? undefined : status, query || undefined),
    { refreshInterval: 10000 }
  );

  const handleSearch = () => setQuery(queryInput.trim());

  const handleMarkRefund = async (tx: SepayTransaction) => {
    try {
      setProcessingRef(tx.transaction_ref);
      await markRefundHandled(tx.transaction_ref, note);
      toast.success(`Đã đánh dấu hoàn tiền thủ công: ${tx.transaction_ref}`);
      setNote("");
      await mutate();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || "Không thể cập nhật hoàn tiền thủ công");
    } finally {
      setProcessingRef(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch SePay</CardTitle>
          <CardDescription>Theo dõi giao dịch và xử lý case hoàn tiền thủ công cho webhook đến muộn.</CardDescription>
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
                {opt}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Tìm theo transaction_ref / provider_reference / order_id"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
            />
            <Button type="button" onClick={handleSearch}>Tìm</Button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ghi chú hoàn tiền thủ công (tùy chọn)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction Ref</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Hoàn tiền thủ công</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7}>Đang tải...</TableCell></TableRow>
              ) : !data || data.length === 0 ? (
                <TableRow><TableCell colSpan={7}>Không có giao dịch phù hợp</TableCell></TableRow>
              ) : (
                data.map((tx) => (
                  <TableRow key={tx.transaction_ref}>
                    <TableCell className="font-mono text-xs">{tx.transaction_ref}</TableCell>
                    <TableCell>#{tx.order_id}</TableCell>
                    <TableCell>{formatCurrency(tx.amount)}</TableCell>
                    <TableCell><Badge variant={statusColor(tx.status)}>{tx.status}</Badge></TableCell>
                    <TableCell>{formatDate(tx.paid_at || tx.created_at)}</TableCell>
                    <TableCell>
                      {tx.refunded_manual ? (
                        <span className="text-green-600">Đã xử lý ({tx.refunded_by || "admin"})</span>
                      ) : tx.refund_required_manual ? (
                        <span className="text-amber-600">Cần xử lý</span>
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        disabled={!tx.refund_required_manual || !!tx.refunded_manual || processingRef === tx.transaction_ref}
                        onClick={() => handleMarkRefund(tx)}
                      >
                        {processingRef === tx.transaction_ref ? "Đang cập nhật..." : "Đánh dấu đã hoàn"}
                      </Button>
                    </TableCell>
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
