import api from "@/lib/axios";

export type SepayTransaction = {
  id: number;
  transaction_ref: string;
  provider_reference: string | null;
  order_id: number;
  table_id: number | null;
  status: string;
  amount: number;
  refund_required_manual?: boolean;
  refunded_manual?: boolean;
  refunded_by?: string | null;
  refunded_at?: string | null;
  created_at?: string;
  paid_at?: string | null;
};

export async function listSepayTransactions(status?: string, query?: string) {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (query) params.query = query;
  const res = await api.get('/payments/sepay/transactions', { params });
  return res.data as SepayTransaction[];
}

export async function markRefundHandled(transactionRef: string, note: string) {
  const res = await api.post(`/payments/sepay/${encodeURIComponent(transactionRef)}/mark-refund-handled`, { note });
  return res.data as SepayTransaction;
}
