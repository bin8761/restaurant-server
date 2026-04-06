'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface Reservation {
  id: number;
  tableId: number;
  customerName: string;
  customerPhone: string;
  partySize: number;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  customerId?: number;
}

interface TableInfo {
  id: number;
  name: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'completed', label: 'Hoàn thành' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  completed: 'Hoàn thành',
  no_show: 'Không đến',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  no_show: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function ReservationsPage() {
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);

  const tableNameMap = useMemo(() => {
    const map = new Map<number, string>();
    tables.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [tables]);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reservationsResult, tablesResult] = await Promise.allSettled([
        api.get('/tables/admin/reservations', {
          params: statusFilter === 'all' ? {} : { status: statusFilter },
        }),
        api.get('/tables'),
      ]);

      if (reservationsResult.status === 'rejected') {
        throw reservationsResult.reason;
      }

      setReservations(reservationsResult.value.data || []);
      if (tablesResult.status === 'fulfilled') {
        setTables(tablesResult.value.data || []);
      } else {
        // Không chặn trang nếu API tables lỗi; fallback hiển thị Bàn #{id}
        setTables([]);
      }
    } catch (err) {
      console.error('Fetch reservations failed:', err);
      toast.error('Không thể tải danh sách đơn đặt bàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 20000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateStatus = async (reservationId: number, status: 'confirmed' | 'cancelled') => {
    try {
      setUpdatingId(reservationId);
      await api.put(`/tables/reservations/${reservationId}/status`, { status });
      toast.success(status === 'confirmed' ? 'Đã xác nhận đơn đặt bàn' : 'Đã hủy đơn đặt bàn');
      // Auto-switch to 'all' to show the updated reservation
      setStatusFilter('all');
      await fetchData();
    } catch (err) {
      console.error('Update reservation status failed:', err);
      toast.error('Không thể cập nhật trạng thái đơn đặt bàn');
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = reservations.filter((r) => r.status === 'pending').length;
  const confirmedCount = reservations.filter((r) => r.status === 'confirmed').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Quản lý đơn đặt bàn</h2>
          <p className="text-sm text-muted-foreground">
            Thu ngân xác nhận hoặc hủy các đơn khách đặt trực tuyến. Đơn mới luôn ở trạng thái chờ xác nhận.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Tổng đơn</p>
            <p className="text-2xl font-bold">{reservations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Chờ xác nhận</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Đã xác nhận</p>
            <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn đặt bàn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
              Không có đơn đặt bàn nào theo bộ lọc hiện tại.
            </div>
          ) : (
            reservations.map((r) => (
              <div key={r.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1 text-sm">
                    <p className="text-base font-semibold">
                      {tableNameMap.get(r.tableId) || `Bàn ${r.tableId}`}
                    </p>
                    <p>
                      <span className="font-medium">Khách:</span> {r.customerName || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">SĐT:</span> {r.customerPhone || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Số khách:</span> {r.partySize}
                    </p>
                    <p>
                      <span className="font-medium">Thời gian:</span> {formatDateTime(r.startTime)} - {formatDateTime(r.endTime)}
                    </p>
                    {r.notes && (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Ghi chú:</span> {r.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-[210px] flex-col items-start gap-2 md:items-end">
                    <Badge className={`border ${STATUS_BADGE[r.status] || STATUS_BADGE.pending}`}>
                      {STATUS_LABELS[r.status] || r.status}
                    </Badge>

                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateStatus(r.id, 'confirmed')}
                          disabled={updatingId === r.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Xác nhận
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatus(r.id, 'cancelled')}
                          disabled={updatingId === r.id}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Hủy
                        </Button>
                      </div>
                    )}

                    {r.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(r.id, 'cancelled')}
                        disabled={updatingId === r.id}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Hủy đơn
                      </Button>
                    )}

                    {r.status !== 'pending' && r.status !== 'confirmed' && (
                      <div className="text-xs text-muted-foreground">Không có thao tác thêm</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <CalendarClock className="h-4 w-4" />
        Đơn do khách tạo từ website luôn bắt đầu ở trạng thái "pending" (chờ xác nhận).
      </div>
    </div>
  );
}
