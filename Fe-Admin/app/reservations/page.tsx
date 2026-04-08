'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, XCircle, RefreshCw, LogIn, ListChecks, UserX } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// API trả về snake_case (spring.jackson.property-naming-strategy: SNAKE_CASE)
interface Reservation {
  id: number;
  table_id: number;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  start_time: string;
  end_time: string;
  status: string;
  is_buffet: boolean;
  buffet_package_name?: string;
  notes?: string;
  customer_id?: number;
}

interface TableInfo {
  id: number;
  name: string;
}

interface CheckinResult {
  reservation_id: number;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  table_name: string;
  qr_code?: string;         // base64 PNG từ generateDynamicQRCode
  url?: string;             // URL được mã hóa trong QR
  expires_at?: string;
  seconds_remaining?: number;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'serving', label: 'Đang phục vụ' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'no_show', label: 'Không đến' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  serving: 'Đang phục vụ',
  cancelled: 'Đã hủy',
  completed: 'Hoàn thành',
  no_show: 'Không đến',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  serving: 'bg-purple-100 text-purple-800 border-purple-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  no_show: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function ReservationsPage() {
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  // allReservations: luôn fetch tất cả để đếm chính xác; reservations: đã lọc hiển thị
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null);

  const tableNameMap = useMemo(() => {
    const map = new Map<number, string>();
    tables.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [tables]);

  const reservations = useMemo(() => {
    if (statusFilter === 'all') return allReservations;
    return allReservations.filter((r) => r.status === statusFilter);
  }, [allReservations, statusFilter]);

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
      // Luôn lấy tất cả để đếm đúng; lọc ở phía client
      const [reservationsResult, tablesResult] = await Promise.allSettled([
        api.get('/tables/admin/reservations'),
        api.get('/tables'),
      ]);

      if (reservationsResult.status === 'rejected') {
        throw reservationsResult.reason;
      }

      setAllReservations(reservationsResult.value.data || []);
      if (tablesResult.status === 'fulfilled') {
        setTables(tablesResult.value.data || []);
      } else {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (
    reservationId: number,
    status: 'confirmed' | 'cancelled' | 'no_show' | 'completed',
  ) => {
    try {
      setUpdatingId(reservationId);
      await api.put(`/tables/reservations/${reservationId}/status`, { status });
      const labels: Record<string, string> = {
        confirmed: 'Đã xác nhận đơn đặt bàn',
        cancelled: 'Đã hủy đơn đặt bàn',
        no_show: 'Đã đánh dấu khách không đến',
        completed: 'Đã kết thúc phục vụ',
      };
      toast.success(labels[status] || 'Cập nhật thành công');
      await fetchData();
    } catch (err) {
      console.error('Update reservation status failed:', err);
      toast.error('Không thể cập nhật trạng thái đơn đặt bàn');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckin = async (r: Reservation) => {
    try {
      setUpdatingId(r.id);
      const res = await api.post(`/tables/reservations/${r.id}/checkin`);
      setCheckinResult(res.data);
      toast.success('Nhận bàn thành công – QR đã được tạo');
      await fetchData();
    } catch (err: any) {
      console.error('Checkin failed:', err);
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Không thể nhận bàn';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = allReservations.filter((r) => r.status === 'pending').length;
  const confirmedCount = allReservations.filter((r) => r.status === 'confirmed').length;
  const servingCount = allReservations.filter((r) => r.status === 'serving').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Quản lý đơn đặt bàn</h2>
          <p className="text-sm text-muted-foreground">
            Thu ngân xác nhận, nhân viên nhận bàn khi khách đến. Đơn mới luôn ở trạng thái chờ xác nhận.
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Tổng đơn</p>
            <p className="text-2xl font-bold">{allReservations.length}</p>
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
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Đang phục vụ</p>
            <p className="text-2xl font-bold text-purple-600">{servingCount}</p>
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
                      {tableNameMap.get(r.table_id) || `Bàn #${r.table_id}`}
                    </p>
                    <p>
                      <span className="font-medium">Khách:</span> {r.customer_name || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">SĐT:</span> {r.customer_phone || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Số khách:</span> {r.party_size ?? 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Thời gian:</span>{' '}
                      {formatDateTime(r.start_time)} – {formatDateTime(r.end_time)}
                    </p>
                    {r.is_buffet && (
                      <p className="text-orange-600 font-medium">
                        🍽️ Buffet{r.buffet_package_name ? ` – ${r.buffet_package_name}` : ''}
                      </p>
                    )}
                    {r.notes && (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Ghi chú:</span> {r.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-[210px] flex-col items-start gap-2 md:items-end">
                    <Badge className={`border ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {STATUS_LABELS[r.status] || r.status}
                    </Badge>

                    {/* pending: xác nhận hoặc hủy */}
                    {r.status === 'pending' && (
                      <div className="flex gap-2 flex-wrap justify-end">
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

                    {/* confirmed: nhận bàn / không đến / hủy */}
                    {r.status === 'confirmed' && (
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleCheckin(r)}
                          disabled={updatingId === r.id}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <LogIn className="mr-1 h-4 w-4" />
                          Nhận bàn
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(r.id, 'no_show')}
                          disabled={updatingId === r.id}
                        >
                          <UserX className="mr-1 h-4 w-4" />
                          Không đến
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

                    {/* serving: kết thúc phục vụ */}
                    {r.status === 'serving' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(r.id, 'completed')}
                        disabled={updatingId === r.id}
                        className="border-blue-400 text-blue-700 hover:bg-blue-50"
                      >
                        <ListChecks className="mr-1 h-4 w-4" />
                        Kết thúc phục vụ
                      </Button>
                    )}

                    {!['pending', 'confirmed', 'serving'].includes(r.status) && (
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
        Luồng: <strong>Chờ xác nhận</strong> → <strong>Đã xác nhận</strong> → <strong>Nhận bàn</strong> → <strong>Đang phục vụ</strong> → <strong>Hoàn thành</strong>
      </div>

      {/* Dialog QR sau khi nhận bàn */}
      <Dialog open={!!checkinResult} onOpenChange={(open) => { if (!open) setCheckinResult(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>✅ Nhận bàn thành công</DialogTitle>
            <DialogDescription>
              Đưa QR này cho khách quét để bắt đầu đặt món.
            </DialogDescription>
          </DialogHeader>
          {checkinResult && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-gray-50 p-3 space-y-1">
                <p><span className="font-medium">Bàn:</span> {checkinResult.table_name}</p>
                <p><span className="font-medium">Khách:</span> {checkinResult.customer_name}</p>
                <p><span className="font-medium">SĐT:</span> {checkinResult.customer_phone}</p>
                <p><span className="font-medium">Số khách:</span> {checkinResult.party_size}</p>
                {checkinResult.expires_at && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">QR hết hạn lúc:</span>{' '}
                    {new Date(checkinResult.expires_at).toLocaleString('vi-VN')}
                  </p>
                )}
                {checkinResult.seconds_remaining != null && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Còn hiệu lực:</span>{' '}
                    {Math.floor(checkinResult.seconds_remaining / 60)} phút
                  </p>
                )}
              </div>
              {checkinResult.qr_code ? (
                <div className="flex justify-center">
                  <img
                    src={checkinResult.qr_code}
                    alt="QR Code"
                    className="w-48 h-48 border rounded-lg shadow"
                  />
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-xs">QR đã được gửi vào hệ thống.</p>
              )}
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                ⚠️ QR chỉ dùng được 1 thiết bị. Sau khi quét, khách có thể gọi món ngay.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCheckinResult(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
