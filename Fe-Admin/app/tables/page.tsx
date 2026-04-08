'use client';

import { useEffect, useState } from 'react';
import { QrCode, Trash2, Plus, Wine, Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Table {
  id: string;
  name: string;
  status: 'Trống' | 'Đang sử dụng' | 'Đã đặt' | string;
  is_buffet: boolean;
  capacity?: number;
  created_at?: string;
  updated_at?: string;
}

interface UpcomingReservation {
  id: number;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone?: string;
  partySize: number;
  notes?: string;
  status: string;
}

interface ActiveKeyInfo {
  expiresAt: string;
  secondsRemaining: number;
}

interface TableEnrichment {
  upcoming?: UpcomingReservation;
  activeKey?: ActiveKeyInfo;
}

export default function TableManagementPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrWarning, setQrWarning] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [enrichments, setEnrichments] = useState<Map<string, TableEnrichment>>(new Map());
  const [tick, setTick] = useState(0); // cập nhật mỗi giây cho countdown
  const [expandedUpcomingTableId, setExpandedUpcomingTableId] = useState<string | null>(null);
  const [showDialogUpcomingDetail, setShowDialogUpcomingDetail] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    status: 'Trống' | 'Đang sử dụng' | 'Đã đặt';
    isBuffet: boolean;
    capacity: number;
  }>({
    name: '',
    status: 'Trống',
    isBuffet: false,
    capacity: 2,
  });

  // Fetch tables on mount
  useEffect(() => {
    fetchTables();
  }, []);

  // Countdown tick mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTables = async () => {
    try {
      setError(null);
      const response = await api.get('/tables');
      const tableList: Table[] = response.data || [];
      setTables(tableList);
      fetchEnrichments(tableList);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch tables';
      setError(errorMessage);
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrichments = async (tableList: Table[]) => {
    const results = await Promise.allSettled(
      tableList.map(async (table) => {
        const [upcomingRes, activeKeyRes] = await Promise.allSettled([
          api.get(`/tables/${table.id}/upcoming-reservation`).catch(() => null),
          table.status === 'Đang sử dụng'
            ? api.get(`/tables/${table.id}/active-key`).catch(() => null)
            : Promise.resolve(null),
        ]);
        const rawUpcoming =
          upcomingRes.status === 'fulfilled' && upcomingRes.value?.data
            ? upcomingRes.value.data
            : undefined;

        const normalizeUpcoming = (raw: any): UpcomingReservation | undefined => {
          if (!raw) return undefined;
          return {
            id: raw.id,
            startTime: raw.startTime || raw.start_time,
            endTime: raw.endTime || raw.end_time,
            customerName: raw.customerName || raw.customer_name || 'Khách đặt bàn',
            customerPhone: raw.customerPhone || raw.customer_phone || '',
            partySize: raw.partySize || raw.party_size || 0,
            notes: raw.notes || '',
            status: raw.status || 'pending',
          };
        };

        return {
          tableId: table.id,
          upcoming: normalizeUpcoming(rawUpcoming),
          activeKey:
            activeKeyRes.status === 'fulfilled' && activeKeyRes.value?.data
              ? ({
                  expiresAt: activeKeyRes.value.data.expires_at,
                  secondsRemaining: activeKeyRes.value.data.seconds_remaining,
                } as ActiveKeyInfo)
              : undefined,
        };
      })
    );

    const map = new Map<string, TableEnrichment>();
    results.forEach((r) => {
      if (r.status === 'fulfilled') {
        map.set(r.value.tableId, {
          upcoming: r.value.upcoming,
          activeKey: r.value.activeKey,
        });
      }
    });
    setEnrichments(map);
  };

  const handleCreateTable = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên bàn');
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/tables', {
        name: formData.name,
        status: formData.status,
        isBuffet: formData.isBuffet,
        capacity: formData.capacity,
      });
      toast.success('Tạo bàn thành công');
      setIsCreateDialogOpen(false);
      resetForm();
      await fetchTables();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to create table';
      toast.error(`Lỗi: ${errorMsg}`);
      console.error('Error creating table:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateTable = async () => {
    if (!selectedTable || !formData.name.trim()) {
      toast.error('Vui lòng nhập tên bàn');
      return;
    }

    setFormLoading(true);
    try {
      await api.put(`/tables/${selectedTable.id}`, {
        name: formData.name,
        status: formData.status,
        is_buffet: formData.isBuffet,
        capacity: formData.capacity,
      });
      toast.success('Cập nhật bàn thành công');
      setIsDetailDialogOpen(false);
      resetForm();
      await fetchTables();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to update table';
      toast.error(`Lỗi: ${errorMsg}`);
      console.error('Error updating table:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;

    setFormLoading(true);
    try {
      await api.delete(`/tables/${selectedTable.id}`);
      toast.success('Xóa bàn thành công');
      setDeleteConfirmOpen(false);
      setIsDetailDialogOpen(false);
      resetForm();
      await fetchTables();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to delete table';
      toast.error(`Lỗi: ${errorMsg}`);
      console.error('Error deleting table:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!selectedTable) return;

    try {
      const response = await api.post(`/tables/${selectedTable.id}/qr/dynamic`);
      setQrCode(response.data?.qr_code || response.data?.url);
      setQrWarning(response.data?.warning || null);
      setQrExpiresAt(response.data?.expires_at || null);
      setShowQRDialog(true);
      if (response.data?.warning) {
        toast.warning(response.data.warning);
      } else {
        toast.success('Tạo QR code thành công');
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to generate QR';
      toast.error(`Lỗi: ${errorMsg}`);
      console.error('Error generating QR:', err);
    }
  };

  const handleInvalidateKeys = async () => {
    if (!selectedTable) return;

    try {
      await api.post(`/tables/${selectedTable.id}/keys/invalidate`);
      toast.success('Vô hiệu hóa khóa thành công');
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to invalidate keys';
      toast.error(`Lỗi: ${errorMsg}`);
      console.error('Error invalidating keys:', err);
    }
  };

  const openDetailDialog = (table: Table) => {
    setSelectedTable(table);
    setShowDialogUpcomingDetail(false);
    setFormData({
      name: table.name,
      status: table.status as any,
      isBuffet: table.is_buffet,
      capacity: table.capacity || 2,
    });
    setIsDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      status: 'Trống',
      isBuffet: false,
      capacity: 2,
    });
    setSelectedTable(null);
  };

  const getStatusBadge = (status: string) => {
    const s = status ? status.toLowerCase() : '';
    let config = { variant: 'secondary', label: 'Trống' };
    
    if (s.includes('occupied') || s.includes('đang sử dụng') || s.includes('đang phục vụ') || s.includes('chờ')) {
      config = { variant: 'destructive', label: 'Đang phục vụ' };
    } else if (s.includes('reserved') || s.includes('đã đặt')) {
      config = { variant: 'outline', label: 'Đã đặt' };
    }
    
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  // Tính countdown từ expiresAt (dùng tick để re-render mỗi giây)
  const formatCountdown = (expiresAt: string): string => {
    void tick; // lệ thuộc tick để re-render
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    if (diff <= 0) return 'Hết phiên';
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 0) return `${h}g ${m.toString().padStart(2, '0')}p ${s.toString().padStart(2, '0')}s`;
    return `${m}p ${s.toString().padStart(2, '0')}s`;
  };

  const formatTime = (isoStr: string): string => {
    return new Date(isoStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoStr: string): string => {
    const d = new Date(isoStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hôm nay';
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return 'Ngày mai';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const isValidDateString = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    return !Number.isNaN(new Date(dateStr).getTime());
  };

  const minutesUntil = (dateStr: string): number => {
    void tick;
    return Math.floor((new Date(dateStr).getTime() - Date.now()) / 60000);
  };

  const shouldShowUpcoming = (upcoming?: UpcomingReservation): boolean => {
    if (!upcoming || !isValidDateString(upcoming.startTime)) return false;
    const mins = minutesUntil(upcoming.startTime);
    return mins >= 0 && mins <= 30;
  };

  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex gap-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Skeleton className="h-9 flex-1" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bàn theo tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4" />
              Thêm bàn
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo bàn mới</DialogTitle>
              <DialogDescription>Điền thông tin để tạo bàn mới</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên bàn</Label>
                <Input
                  id="name"
                  placeholder="VD: Bàn 01, Bàn VIP..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Sức chứa</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="buffet">Là bàn buffet</Label>
                <Switch
                  id="buffet"
                  checked={formData.isBuffet}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isBuffet: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleCreateTable} disabled={formLoading}>
                {formLoading ? 'Đang tạo...' : 'Tạo bàn'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
          <div>
            <p className="font-medium text-red-900">Lỗi</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTables}>
            Thử lại
          </Button>
        </div>
      )}

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? 'Không tìm thấy bàn nào' : 'Chưa có bàn nào'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const enrich = enrichments.get(table.id);
            return (
            <div
              key={table.id}
              className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => openDetailDialog(table)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{table.name}</h3>
                      {table.is_buffet && (
                        <Wine className="w-4 h-4 text-purple-500" />
                      )}
                    </div>
                    {table.capacity && (
                      <p className="text-xs text-muted-foreground">Sức chứa: {table.capacity} người</p>
                    )}
                  </div>
                </div>
                <div>{getStatusBadge(table.status)}</div>

                {/* Countdown khi bàn đang sử dụng */}
                {enrich?.activeKey && (
                  <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
                    <span className="text-xs">⏱️</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-red-700 tabular-nums">
                        {formatCountdown(enrich.activeKey.expiresAt)}
                      </span>
                      <span className="text-[10px] text-red-500">còn lại trong phiên</span>
                    </div>
                  </div>
                )}

                {/* Reservation sắp tới */}
                {shouldShowUpcoming(enrich?.upcoming) && enrich?.upcoming && (
                  <div
                    className="flex flex-col gap-2 bg-blue-50 border border-blue-200 rounded-md px-2 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className="text-xs mt-0.5">📅</span>
                      <div className="flex flex-col flex-1">
                        <span className="text-xs font-semibold text-blue-700">
                          {formatDate(enrich.upcoming.startTime)} {formatTime(enrich.upcoming.startTime)}
                        </span>
                        <span className="text-[10px] text-blue-600">
                          Còn {Math.max(0, minutesUntil(enrich.upcoming.startTime))} phút · {enrich.upcoming.partySize} khách
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedUpcomingTableId((prev) =>
                          prev === table.id ? null : table.id
                        );
                      }}
                    >
                      {expandedUpcomingTableId === table.id ? 'Ẩn chi tiết lịch' : 'Xem chi tiết lịch'}
                    </Button>

                    {expandedUpcomingTableId === table.id && (
                      <div className="rounded-md border border-blue-200 bg-white p-2 text-[11px] text-blue-900 space-y-1">
                        <p><span className="font-medium">Khách:</span> {enrich.upcoming.customerName}</p>
                        {!!enrich.upcoming.customerPhone && (
                          <p><span className="font-medium">SĐT:</span> {enrich.upcoming.customerPhone}</p>
                        )}
                        <p><span className="font-medium">Thời gian:</span> {formatDate(enrich.upcoming.startTime)} {formatTime(enrich.upcoming.startTime)} - {formatTime(enrich.upcoming.endTime)}</p>
                        {!!enrich.upcoming.notes && (
                          <p><span className="font-medium">Ghi chú:</span> {enrich.upcoming.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết bàn</DialogTitle>
            <DialogDescription>Quản lý thông tin bàn</DialogDescription>
          </DialogHeader>
          {selectedTable && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="detail-name">Tên bàn</Label>
                <Input
                  id="detail-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Trống">Trống</SelectItem>
                    <SelectItem value="Đang sử dụng">Đang phục vụ</SelectItem>
                    <SelectItem value="Đã đặt">Đã đặt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="detail-capacity">Sức chứa</Label>
                <Input
                  id="detail-capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="detail-buffet">Là bàn buffet</Label>
                <Switch
                  id="detail-buffet"
                  checked={formData.isBuffet}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isBuffet: checked })
                  }
                />
              </div>

              {/* Chi tiết lịch đặt sắp tới trong dialog (không phụ thuộc rule 30p trên card) */}
              <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-900">Lịch đặt sắp tới</p>
                  {(() => {
                    const upcoming = enrichments.get(selectedTable.id)?.upcoming;
                    if (!upcoming || !isValidDateString(upcoming.startTime)) return null;
                    return (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 bg-white"
                        onClick={() => setShowDialogUpcomingDetail((v) => !v)}
                      >
                        {showDialogUpcomingDetail ? 'Ẩn chi tiết lịch' : 'Xem chi tiết lịch'}
                      </Button>
                    );
                  })()}
                </div>

                {(() => {
                  const upcoming = enrichments.get(selectedTable.id)?.upcoming;
                  if (!upcoming || !isValidDateString(upcoming.startTime)) {
                    return <p className="text-xs text-blue-700">Chưa có lịch đặt sắp tới cho bàn này.</p>;
                  }

                  return (
                    <>
                      <p className="text-xs text-blue-800">
                        {formatDate(upcoming.startTime)} {formatTime(upcoming.startTime)} - {formatTime(upcoming.endTime)}
                      </p>
                      {showDialogUpcomingDetail && (
                        <div className="rounded-md border border-blue-200 bg-white p-2 text-xs text-blue-900 space-y-1">
                          <p><span className="font-medium">Khách:</span> {upcoming.customerName}</p>
                          {!!upcoming.customerPhone && (
                            <p><span className="font-medium">SĐT:</span> {upcoming.customerPhone}</p>
                          )}
                          <p><span className="font-medium">Số khách:</span> {upcoming.partySize}</p>
                          <p><span className="font-medium">Trạng thái:</span> {upcoming.status}</p>
                          {!!upcoming.notes && (
                            <p><span className="font-medium">Ghi chú:</span> {upcoming.notes}</p>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          <DialogFooter>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setIsDetailDialogOpen(false)}
                className="flex-1"
              >
                Đóng
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateQR}
                className="flex-1"
              >
                <QrCode className="w-4 h-4" />
                QR code
              </Button>
              <Button
                variant="outline"
                onClick={handleInvalidateKeys}
                className="flex-1"
              >
                Vô hiệu hóa
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </Button>
              <Button
                onClick={handleUpdateTable}
                disabled={formLoading}
                className="flex-1"
              >
                {formLoading ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bàn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bàn "{selectedTable?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTable}
              disabled={formLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {formLoading ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={(open) => { setShowQRDialog(open); if (!open) { setQrWarning(null); setQrExpiresAt(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code cho bàn {selectedTable?.name}</DialogTitle>
            <DialogDescription>
              Sử dụng QR code này cho bàn
            </DialogDescription>
          </DialogHeader>
          {qrWarning && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-lg px-3 py-2 text-sm flex gap-2">
              <span>⚠️</span>
              <span>{qrWarning}</span>
            </div>
          )}
          {qrExpiresAt && (
            <div className="text-center text-sm text-muted-foreground">
              Key hết hạn lúc{' '}
              <span className="font-semibold text-foreground">
                {new Date(qrExpiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          {qrCode && (
            <div className="flex justify-center p-4">
              <img
                src={qrCode}
                alt="QR Code"
                className="w-48 h-48 border rounded-lg"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQRDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
