"use client";

import { useEffect, useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import {
    Search,
    RefreshCw,
    Filter,
    Eye,
    ChefHat,
    Clock,
    CheckCircle,
    XCircle,
    CreditCard,
    Package,
    AlertCircle,
    Receipt,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { kitchenSocket, orderSocket } from "@/lib/socket";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

// Types
interface OrderDetail {
    id: number;
    food_id: number;
    food_name?: string;
    quantity: number;
    price: number;
}

interface KitchenItemStatus {
    order_detail_id: number;
    status: string;
    updated_at?: string;
}

interface OrderSessionSummary {
    representative_order_id: number;
    table_id: number;
    table_key: string;
    total_orders: number;
    total_items: number;
    total_amount: number;
    status: string;
    payment_status: string;
    buffet_active: boolean;
    buffet_package_name?: string;
    last_order_time: string;
}

interface OrderSessionDetail {
    summary: OrderSessionSummary;
    orders: Order[];
}

interface Order {
    id: number;
    table_id: number;
    user_id: number | null;
    table_key: string;
    order_time: string;
    status: string;
    total: number;
    is_buffet: boolean;
    payment_status: string;
    updated_at: string;
    details: OrderDetail[];
}

const getRequestPaymentPayload = (order: Order) => ({
    table_key: order.table_key,
});

// Helper functions
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
};

const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getStatusColor = (status: string | null): string => {
    if (!status) return "bg-muted text-muted-foreground";
    switch (status.toLowerCase()) {
        case "chờ xác nhận":
            return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
        case "đang nấu":
            return "bg-blue-500/10 text-blue-600 border-blue-500/20";
        case "hoàn thành":
            return "bg-green-500/10 text-green-600 border-green-500/20";
        case "đã hủy":
            return "bg-red-500/10 text-red-600 border-red-500/20";
        default:
            return "bg-muted text-muted-foreground";
    }
};

const getPaymentStatusColor = (status: string | null): string => {
    if (!status) return "bg-orange-500/10 text-orange-600 border-orange-500/20"; // default to unpaid
    switch (status.toLowerCase()) {
        case "paid":
            return "bg-green-500/10 text-green-600 border-green-500/20";
        case "unpaid":
            return "bg-orange-500/10 text-orange-600 border-orange-500/20";
        case "pending":
            return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
        default:
            return "bg-muted text-muted-foreground";
    }
};

const getPaymentStatusText = (status: string | null): string => {
    if (!status) return "Chưa thanh toán";
    switch (status.toLowerCase()) {
        case "paid":
            return "Đã thanh toán";
        case "unpaid":
            return "Chưa thanh toán";
        case "pending":
            return "Đang chờ";
        default:
            return status;
    }
};

const getStatusIcon = (status: string | null) => {
    if (!status) return <AlertCircle className="h-4 w-4" />;
    switch (status.toLowerCase()) {
        case "chờ xác nhận":
            return <Clock className="h-4 w-4" />;
        case "đang nấu":
            return <ChefHat className="h-4 w-4" />;
        case "hoàn thành":
            return <CheckCircle className="h-4 w-4" />;
        case "đã hủy":
            return <XCircle className="h-4 w-4" />;
        default:
            return <AlertCircle className="h-4 w-4" />;
    }
};

const ORDER_STATUSES = [
    "Chờ xác nhận",
    "Đang nấu",
    "Hoàn thành",
    "Đã hủy",
];

export default function OrdersManagementPage() {
    const [sessions, setSessions] = useState<OrderSessionSummary[]>([]);
    const [itemStatuses, setItemStatuses] = useState<Record<number, KitchenItemStatus>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterPayment, setFilterPayment] = useState<string>("all");
    const [filterDate, setFilterDate] = useState<string>(
        new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local format
    );

    // Dialog states
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isCompletePaymentDialogOpen, setIsCompletePaymentDialogOpen] = useState(false);

    // Selected order
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [newStatus, setNewStatus] = useState<string>("");
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const sessionsResponse = await api.get("/orders/sessions");
            const nextSessions = sessionsResponse.data || [];

            let kitchenQueue: any[] = [];
            try {
                const kitchenQueueResponse = await api.get("/kitchen/queue");
                kitchenQueue = kitchenQueueResponse.data || [];
            } catch (kitchenErr) {
                console.warn("Kitchen queue unavailable, continue without item status", kitchenErr);
            }

            const nextItemStatuses = kitchenQueue.reduce((acc: Record<number, KitchenItemStatus>, item: any) => {
                if (item.order_detail_id) {
                    acc[item.order_detail_id] = {
                        order_detail_id: item.order_detail_id,
                        status: item.status,
                        updated_at: item.updated_at,
                    };
                }
                return acc;
            }, {});

            setSessions(nextSessions);
            setItemStatuses(nextItemStatuses);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tải dữ liệu đơn hàng";
            setError(errorMessage);
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        // Auto refresh every 10s to catch new orders from customers
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    useEffect(() => {
        let mounted = true;

        kitchenSocket.connect(
            () => {
                if (!mounted) return;

                kitchenSocket.subscribe("/topic/kitchen.queue-updated", (data) => {
                    if (!data?.order_detail_id || !data?.status) return;

                    setItemStatuses((prev) => ({
                        ...prev,
                        [data.order_detail_id]: {
                            order_detail_id: data.order_detail_id,
                            status: data.status,
                            updated_at: data.updated_at,
                        },
                    }));
                });
            },
            (err) => {
                if (!mounted) return;
                console.error("Kitchen socket error", err);
            }
        );

        return () => {
            mounted = false;
            kitchenSocket.disconnect();
        };
    }, []);

    const selectedSessionDetailKey = selectedOrder
        ? `/orders/sessions/detail?tableId=${selectedOrder.table_id}&tableKey=${encodeURIComponent(selectedOrder.table_key || "")}`
        : null;

    const { data: selectedSessionDetail } = useSWR<OrderSessionDetail>(
        selectedSessionDetailKey,
        fetcher
    );

    useEffect(() => {
        let mounted = true;

        orderSocket.connect(
            () => {
                if (!mounted) return;

                const revalidateOrdersView = async () => {
                    await fetchOrders();
                    await mutate("/orders/sessions");
                    if (selectedSessionDetailKey) {
                        await mutate(selectedSessionDetailKey);
                    }
                };

                // Đơn mới từ khách hàng (QR / web)
                orderSocket.subscribe("/topic/order.created", async (data) => {
                    if (!mounted) return;
                    await revalidateOrdersView();
                    toast.info(`Đơn hàng mới`, {
                        description: `Bàn ${data?.table_id ?? ""} vừa đặt thêm món`,
                    });
                });

                // Bếp / admin cập nhật trạng thái đơn
                orderSocket.subscribe("/topic/order.status.updated", async () => {
                    if (!mounted) return;
                    await revalidateOrdersView();
                });

                // Thanh toán hoàn tất
                orderSocket.subscribe("/topic/payment.completed", async () => {
                    if (!mounted) return;
                    await revalidateOrdersView();
                });
            },
            (err) => {
                if (!mounted) return;
                console.error("Order socket error", err);
            }
        );

        return () => {
            mounted = false;
            orderSocket.disconnect();
        };
    }, [fetchOrders, selectedSessionDetailKey]);

    // Filter orders
    const filteredSessions = sessions.filter((session) => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const matchesSearch =
            normalizedQuery === "" ||
            session.representative_order_id.toString().includes(normalizedQuery) ||
            session.table_id.toString().includes(normalizedQuery) ||
            (session.table_key || "").toLowerCase().includes(normalizedQuery) ||
            (session.buffet_package_name || "").toLowerCase().includes(normalizedQuery);
        const matchesStatus = filterStatus === "all" || session.status === filterStatus;
        const paymentStatus = session.payment_status || "unpaid";
        const matchesPayment = filterPayment === "all" || paymentStatus === filterPayment;

        let matchesDate = true;
        if (filterDate) {
            const orderDateStr = new Date(session.last_order_time).toLocaleDateString('en-CA');
            matchesDate = orderDateStr === filterDate;
        }

        return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });

    // Actions
    const handleViewDetail = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailDialogOpen(true);
    };

    const handleOpenStatusDialog = (order: Order) => {
        setSelectedOrder(order);
        setNewStatus(order.status);
        setIsStatusDialogOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedOrder || !newStatus) return;

        setActionLoading(true);
        try {
            await api.put(`/orders/${selectedOrder.id}/status`, { status: newStatus });
            toast.success("Cập nhật trạng thái thành công");
            setIsStatusDialogOpen(false);
            await fetchOrders();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái";
            toast.error(errorMsg);
            console.error("Error updating status:", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmOrder = async () => {
        if (!selectedOrder) return;

        setActionLoading(true);
        try {
            const response = await api.post("/orders/sessions/confirm", {
                table_id: selectedOrder.table_id,
                table_key: selectedOrder.table_key,
            });
            const confirmedCount = response.data?.confirmed_count || 0;
            const message = response.data?.message || "Đã xử lý xác nhận phiên bàn";
            if (confirmedCount > 0) {
                toast.success(message);
            } else {
                toast.info(message);
            }
            setIsConfirmDialogOpen(false);
            await fetchOrders();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi xác nhận đơn hàng";
            toast.error(errorMsg);
            console.error("Error confirming session orders:", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRequestPayment = async () => {
        if (!selectedOrder) return;

        setActionLoading(true);
        try {
            await api.post(
                `/orders/${selectedOrder.id}/request-payment`,
                getRequestPaymentPayload(selectedOrder)
            );
            toast.success("Đã gửi yêu cầu thanh toán");
            setIsPaymentDialogOpen(false);
            await fetchOrders();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi gửi yêu cầu thanh toán";
            toast.error(errorMsg);
            console.error("Error requesting payment:", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompletePayment = async () => {
        if (!selectedOrder) return;

        setActionLoading(true);
        try {
            const sessionDetailResponse = await api.get(
                `/orders/sessions/detail?tableId=${selectedOrder.table_id}&tableKey=${encodeURIComponent(selectedOrder.table_key || "")}`
            );
            const sessionOrders: Order[] = sessionDetailResponse.data?.orders || [];
            const sessionOrderIds = sessionOrders
                .filter((order) => (order.payment_status || "unpaid") !== "paid")
                .map((order) => order.id);

            await api.post("/orders/complete-payment", {
                table_id: selectedOrder.table_id,
                table_key: selectedOrder.table_key,
                order_ids: sessionOrderIds.length > 0 ? sessionOrderIds : [selectedOrder.id],
            });
            toast.success("Đã hoàn tất thanh toán và đóng bàn");
            setIsCompletePaymentDialogOpen(false);
            await fetchOrders();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi hoàn tất thanh toán";
            toast.error(errorMsg);
            console.error("Error completing payment:", err);
        } finally {
            setActionLoading(false);
        }
    };

    // Stats
    const stats = {
        total: sessions.length,
        pending: sessions.filter((o) => o.status === "Chờ xác nhận").length,
        cooking: sessions.filter((o) => o.status === "Đang nấu").length,
        completed: sessions.filter((o) => o.status === "Hoàn thành").length,
        unpaid: sessions.filter((o) => (o.payment_status || "unpaid") === "unpaid").length,
    };

    const selectedSessionOrders = selectedSessionDetail?.orders || [];

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-96 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tổng đơn</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Chờ xác nhận</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Đang nấu</CardTitle>
                        <ChefHat className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.cooking}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Hoàn thành</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Chưa thanh toán</CardTitle>
                        <CreditCard className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.unpaid}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-1 flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo ID đơn, bàn..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-auto"
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-44">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            {ORDER_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterPayment} onValueChange={setFilterPayment}>
                        <SelectTrigger className="w-44">
                            <CreditCard className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Thanh toán" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="paid">Đã thanh toán</SelectItem>
                            <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
                            <SelectItem value="pending">Đang chờ</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" size="icon" onClick={fetchOrders}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex justify-between items-center">
                    <div>
                        <p className="font-medium text-destructive">Lỗi</p>
                        <p className="text-sm text-destructive/80">{error}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchOrders}>
                        Thử lại
                    </Button>
                </div>
            )}

            {/* Orders Table */}
            {filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        {searchQuery || filterStatus !== "all" || filterPayment !== "all"
                            ? "Không tìm thấy đơn hàng nào"
                            : "Chưa có đơn hàng nào"}
                    </p>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-20">Session</TableHead>
                                <TableHead className="w-24">Bàn</TableHead>
                                <TableHead>Thời gian</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Thanh toán</TableHead>
                                <TableHead className="text-right">Tổng tiền</TableHead>
                                <TableHead className="w-32 text-center">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSessions.map((session) => {
                                const sessionRepresentative: Order = {
                                    id: session.representative_order_id,
                                    table_id: session.table_id,
                                    user_id: null,
                                    table_key: session.table_key,
                                    order_time: session.last_order_time,
                                    status: session.status,
                                    total: session.total_amount,
                                    is_buffet: session.buffet_active,
                                    payment_status: session.payment_status,
                                    updated_at: session.last_order_time,
                                    details: [],
                                };
                                return (
                                <TableRow key={`${session.table_id}-${session.table_key}`}>
                                    <TableCell className="font-medium">{session.total_orders} đơn</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">Bàn {session.table_id}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDateTime(session.last_order_time)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`gap-1 ${getStatusColor(session.status)}`}>
                                            {getStatusIcon(session.status)}
                                            {session.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getPaymentStatusColor(session.payment_status)}>
                                            {getPaymentStatusText(session.payment_status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatCurrency(session.total_amount)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleViewDetail(sessionRepresentative)}
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {sessionRepresentative.status === "Chờ xác nhận" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedOrder(sessionRepresentative);
                                                        setIsConfirmDialogOpen(true);
                                                    }}
                                                    title="Xác nhận và gửi bếp"
                                                    className="text-green-600 hover:text-green-700"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {sessionRepresentative.payment_status === "unpaid" && session.status === "Hoàn thành" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedOrder(sessionRepresentative);
                                                        setIsCompletePaymentDialogOpen(true);
                                                    }}
                                                    title="Hoàn tất thanh toán"
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    <CreditCard className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Order Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Chi tiết session bàn {selectedOrder?.table_id}</DialogTitle>
                        <DialogDescription>Thông tin chi tiết các đơn trong cùng session</DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Bàn:</span>
                                    <span className="ml-2 font-medium">{selectedOrder.table_id}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Buffet:</span>
                                    <span className="ml-2 font-medium">{selectedOrder.is_buffet ? "Có" : "Không"}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Thời gian:</span>
                                    <span className="ml-2 font-medium">{formatDateTime(selectedSessionOrders[0]?.order_time || selectedOrder.order_time)}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Cập nhật:</span>
                                    <span className="ml-2 font-medium">{formatDateTime(selectedSessionOrders[selectedSessionOrders.length - 1]?.updated_at || selectedOrder.updated_at)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                                <Badge className={getPaymentStatusColor(selectedOrder.payment_status)}>
                                    {getPaymentStatusText(selectedOrder.payment_status)}
                                </Badge>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-medium mb-2">Món ăn trong session</h4>
                                <div className="space-y-2">
                                    {selectedSessionOrders.flatMap((order) =>
                                        order.details.map((item) => (
                                            <div key={`${order.id}-${item.id}`} className="flex justify-between items-center text-sm gap-4">
                                                <div className="min-w-0">
                                                    <div>
                                                        {item.food_name || `Món #${item.food_id}`} x{item.quantity}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Đơn #{order.id}
                                                        {itemStatuses[item.id]?.status ? ` · ${itemStatuses[item.id].status}` : ""}
                                                    </div>
                                                </div>
                                                <span className="font-medium whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Tổng cộng</span>
                                <span className="text-primary">
                                    {formatCurrency(selectedSessionDetail?.summary.total_amount || 0)}
                                </span>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                            Đóng
                        </Button>
                        <Button variant="outline" onClick={() => handleOpenStatusDialog(selectedOrder!)}>
                            Đổi trạng thái
                        </Button>
                        {selectedOrder?.payment_status === "unpaid" && (
                            <Button
                                onClick={() => {
                                    setIsDetailDialogOpen(false);
                                    setIsPaymentDialogOpen(true);
                                }}
                            >
                                Yêu cầu thanh toán
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update Status Dialog */}
            <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
                        <DialogDescription>Chọn trạng thái mới cho đơn hàng #{selectedOrder?.id}</DialogDescription>
                    </DialogHeader>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            {ORDER_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleUpdateStatus} disabled={actionLoading}>
                            {actionLoading ? "Đang cập nhật..." : "Cập nhật"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Order Dialog */}
            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận đơn hàng</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn gửi các món còn chờ xác nhận của bàn {selectedOrder?.table_id} sang bếp?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmOrder} disabled={actionLoading}>
                            {actionLoading ? "Đang xử lý..." : "Xác nhận & Gửi bếp"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Request Payment Dialog */}
            <AlertDialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Yêu cầu thanh toán</AlertDialogTitle>
                        <AlertDialogDescription>
                            Gửi yêu cầu thanh toán cho đơn hàng #{selectedOrder?.id}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRequestPayment} disabled={actionLoading}>
                            {actionLoading ? "Đang gửi..." : "Gửi yêu cầu"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Complete Payment Dialog */}
            <AlertDialog open={isCompletePaymentDialogOpen} onOpenChange={setIsCompletePaymentDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hoàn tất thanh toán</AlertDialogTitle>
                        <AlertDialogDescription>
                            Xác nhận đã thu tiền xong cho đơn hàng #{selectedOrder?.id}?
                            <br />
                            <span className="font-medium">
                                Tổng tiền: {selectedOrder && formatCurrency(selectedOrder.total)}
                            </span>
                            <br />
                            Bàn sẽ được đặt về trạng thái trống sau khi hoàn tất.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCompletePayment} disabled={actionLoading}>
                            {actionLoading ? "Đang xử lý..." : "Hoàn tất thanh toán"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
