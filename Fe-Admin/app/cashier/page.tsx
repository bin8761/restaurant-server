"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import {
    Clock,
    CheckCircle,
    AlertCircle,
    Banknote,
    Users,
    Receipt,
    DollarSign,
    Eye,
    CreditCard,
    History,
    Wifi,
    WifiOff,
    Printer
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import { paymentSocket, orderSocket } from "@/lib/socket";

// Types
interface WaitingPayment {
    order_id: number;
    table_id: number;
    table_key: string;
    total: number;
    request_time: string;
    status: string;
    order_count: number;
}

interface OrderItem {
    id: number;
    menu_item_name: string;
    quantity: number;
    price: number;
    total: number;
}

interface Order {
    id: number;
    table_id: number;
    table_key: string;
    status: string;
    payment_status: string;
    total: number;
    created_at: string;
    items?: OrderItem[];
}

interface OrderSessionSummary {
    table_id: number;
    table_key: string;
    total_amount: number;
    order_count: number;
    status: string;
    payment_status: string;
    last_order_time: string;
}

interface OrderSessionDetail {
    summary: OrderSessionSummary;
    orders: Order[];
}

interface PaymentHistory {
    id: number;
    order_id: number;
    amount: number;
    method: string;
    paid_at: string;
    status: string;
}

// Fetchers
const fetcher = (url: string) => api.get(url).then((res) => res.data);

// Format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
};

export default function CashierPage() {
    const [selectedPayment, setSelectedPayment] = useState<WaitingPayment | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize WebSockets
    useEffect(() => {
        let mounted = true;

        paymentSocket.connect(
            () => {
                if (!mounted) return;
                setIsConnected(true);
                
                // Lắng nghe sự kiện khách yêu cầu thanh toán
                paymentSocket.subscribe('/topic/payment.request', (data) => {
                    toast.info(`Bàn ${data.table_id} yêu cầu thanh toán!`, {
                        description: `Tổng tiền: ${formatCurrency(data.amount)}`
                    });
                    mutate("/payments/waiting");
                    mutate("/orders/sessions");
                });

                // Lắng nghe sự kiện thanh toán hoàn tất (nếu có cashier khác thao tác)
                paymentSocket.subscribe('/topic/payment.completed', (data) => {
                    mutate("/payments/waiting");
                    mutate("/orders/sessions");
                    if (data?.table_id && data?.table_key) {
                        mutate(`/orders/sessions/detail?tableId=${data.table_id}&tableKey=${encodeURIComponent(data.table_key)}`);
                    }
                    mutate("/payments/history");
                });
            },
            (err) => {
                if (!mounted) return;
                setIsConnected(false);
                console.error("Socket error", err);
            }
        );

        return () => {
            mounted = false;
            paymentSocket.disconnect();
        };
    }, []);

    // Lắng nghe đơn hàng mới + cập nhật trạng thái từ order-service
    useEffect(() => {
        let mounted = true;

        orderSocket.connect(
            () => {
                if (!mounted) return;

                // Khách vừa đặt món mới
                orderSocket.subscribe("/topic/order.created", (data) => {
                    if (!mounted) return;
                    toast.info(`Đơn hàng mới - Bàn ${data?.table_id ?? ""}`, {
                        description: "Khách vừa đặt thêm món",
                    });
                    mutate("/orders/sessions");
                    mutate("/payments/waiting");
                });

                // Trạng thái đơn thay đổi (bếp xác nhận, hoàn thành,…)
                orderSocket.subscribe("/topic/order.status.updated", (data) => {
                    if (!mounted) return;
                    mutate("/orders/sessions");
                    mutate("/payments/waiting");
                    if (data?.table_id != null && data?.table_key) {
                        mutate(`/orders/sessions/detail?tableId=${data.table_id}&tableKey=${encodeURIComponent(data.table_key)}`);
                    }
                });
            },
            (err) => {
                if (!mounted) return;
                console.error("Order socket error (cashier):", err);
            }
        );

        return () => {
            mounted = false;
            orderSocket.disconnect();
        };
    }, []);

    // Fetch waiting payments
    const { data: waitingPayments, isLoading: isLoadingWaiting } = useSWR<WaitingPayment[]>(
        "/payments/waiting",
        fetcher,
    );

    const { data: allSessions, isLoading: isLoadingOrders } = useSWR<OrderSessionSummary[]>(
        "/orders/sessions",
        fetcher,
    );

    const selectedSessionDetailKey = selectedPayment
        ? `/orders/sessions/detail?tableId=${selectedPayment.table_id}&tableKey=${encodeURIComponent(selectedPayment.table_key || "")}`
        : null;

    const { data: selectedSessionDetail } = useSWR<OrderSessionDetail>(
        selectedSessionDetailKey,
        fetcher
    );

    // Fetch payment history
    const { data: payHistory, isLoading: isLoadingHistory } = useSWR<PaymentHistory[]>(
        "/payments/history",
        fetcher
    );

    const unpaidSessions = allSessions?.filter(
        (session: OrderSessionSummary) => session.payment_status === "unpaid"
    ) || [];

    // Calculate stats
    const totalWaiting = waitingPayments?.length || 0;
    const totalWaitingAmount = waitingPayments?.reduce((sum: number, p: WaitingPayment) => sum + p.total, 0) || 0;
    const totalUnpaid = unpaidSessions.length;
    const totalUnpaidAmount = unpaidSessions.reduce((sum: number, s: OrderSessionSummary) => sum + s.total_amount, 0);

    const selectedSessionOrders = selectedSessionDetail?.orders || [];

    const selectedSessionItems = selectedSessionOrders.flatMap((order: Order) =>
        (order.items || []).map((item: OrderItem) => ({
            ...item,
            order_id: order.id,
        }))
    );

    // Handle view detail
    const handleViewDetail = (payment: WaitingPayment) => {
        setSelectedPayment(payment);
        setDetailDialogOpen(true);
    };

    // Handle open payment dialog
    const handleOpenPaymentDialog = (payment: WaitingPayment) => {
        setSelectedPayment(payment);
        setPaymentDialogOpen(true);
    };

    // Print bill generator
    const printBill = (payment: WaitingPayment) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
        <html>
        <head>
            <title>Hóa đơn - Bàn ${payment.table_id}</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; color: #000; }
                h2 { text-align: center; font-size: 18px; margin-bottom: 5px; }
                p { text-align: center; font-size: 12px; margin: 2px 0; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .flex { display: flex; justify-content: space-between; }
                .bold { font-weight: bold; }
                table { width: 100%; font-size: 12px; border-collapse: collapse; }
                th, td { text-align: left; padding: 4px 0; }
                .right { text-align: right; }
                .total { font-size: 16px; font-weight: bold; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h2>NHÀ HÀNG AURORA</h2>
            <p>123 Đường Tôn Đức Thắng, Q1, TP.HCM</p>
            <p>Điện thoại: 1900 1234</p>
            <div class="divider"></div>
            <p class="bold">HÓA ĐƠN THANH TOÁN</p>
            <div class="flex">
                <span>Bàn: ${payment.table_id}</span>
                <span>${new Date().toLocaleDateString('vi-VN')}</span>
            </div>
            <div class="flex">
                <span>Mã yêu cầu: #${payment.order_id}</span>
                <span>${new Date().toLocaleTimeString('vi-VN')}</span>
            </div>
            <div class="divider"></div>
            <div class="flex total">
                <span>TỔNG CỘNG:</span>
                <span>${formatCurrency(payment.total)}</span>
            </div>
            <div class="divider"></div>
            <p>Cảm ơn & Hẹn gặp lại quý khách!</p>
            <p>Password Wifi: aurora123</p>
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    // Handle process payment
    const handleProcessPayment = async () => {
        if (!selectedPayment) return;

        setIsProcessing(true);
        try {
            const payload = {
                order_id: selectedPayment.order_id,
                table_id: selectedPayment.table_id,
                table_key: selectedPayment.table_key,
            };
            
            console.log("📤 Sending payment processing request:", payload);
            
            const response = await api.post("/payments/process/cash", payload);
            
            console.log("✅ Payment processed successfully:", response.data);
            
            toast.success("Thanh toán thành công", {
                description: `Bàn ${selectedPayment.table_id} đã được thanh toán và giải phóng.`,
            });

            // Tự động in hóa đơn
            printBill(selectedPayment);

            setPaymentDialogOpen(false);
            setSelectedPayment(null);
            mutate("/payments/waiting");
            mutate("/orders/sessions");
            mutate("/payments/history");
        } catch (error: any) {
            console.error("❌ Payment error:", error);
            
            // Extract error details
            const errorMessage = error.response?.data?.error || 
                                error.response?.data?.message || 
                                error.message || 
                                "Không rõ lỗi";
            const errorStatus = error.response?.status || "unknown";
            
            console.error(`❌ Error status: ${errorStatus}, message: ${errorMessage}`);
            
            toast.error("Thanh toán thất bại", {
                description: `(${errorStatus}) ${errorMessage}`,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Thu Ngân</h2>
                    <p className="text-muted-foreground mt-1">Quản lý thanh toán và hóa đơn bàn</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className={totalWaiting > 0 ? "border-amber-500 shadow-amber-500/20" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Chờ thanh toán</CardTitle>
                        <Clock className={totalWaiting > 0 ? "size-4 text-amber-500" : "size-4 text-muted-foreground"} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalWaiting}</div>
                        <p className="text-xs text-muted-foreground">bàn yêu cầu tính tiền</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tổng tiền chờ thu</CardTitle>
                        <DollarSign className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalWaitingAmount)}</div>
                        <p className="text-xs text-muted-foreground">từ {totalWaiting} bàn</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Đang dùng bữa</CardTitle>
                        <Users className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUnpaid}</div>
                        <p className="text-xs text-muted-foreground">bàn chưa thanh toán</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tổng chưa thu</CardTitle>
                        <AlertCircle className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalUnpaidAmount)}</div>
                        <p className="text-xs text-muted-foreground">từ khách đang ăn</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="waiting" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="waiting" className="gap-2">
                        <Receipt className="size-4" />
                        Yêu cầu (<span className="text-amber-500 font-bold">{totalWaiting}</span>)
                    </TabsTrigger>
                    <TabsTrigger value="unpaid" className="gap-2">
                        <Users className="size-4" />
                        Đang dùng bữa ({totalUnpaid})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="size-4" />
                        Lịch sử thanh toán
                    </TabsTrigger>
                </TabsList>

                {/* Waiting Payments Tab */}
                <TabsContent value="waiting">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách yêu cầu thanh toán</CardTitle>
                            <CardDescription>
                                Các bàn đã nhấn yêu cầu tính tiền và đang chờ thu ngân xử lý
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingWaiting ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-16 w-full" />
                                    ))}
                                </div>
                            ) : !waitingPayments || waitingPayments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                    <CheckCircle className="size-12 text-green-500/50 mb-4" />
                                    <h3 className="text-lg font-medium text-foreground">Không có yêu cầu thanh toán</h3>
                                    <p>Tất cả các bàn đã được thanh toán hoặc chưa yêu cầu tính tiền.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bàn</TableHead>
                                            <TableHead>Số lượng đơn</TableHead>
                                            <TableHead>Tổng tiền</TableHead>
                                            <TableHead>Thời gian yêu cầu</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead className="text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {waitingPayments.map((payment: WaitingPayment) => (
                                            <TableRow key={payment.order_id} className="bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-md">
                                                            {payment.table_id}
                                                        </div>
                                                        <span className="font-semibold text-lg">Bàn {payment.table_id}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{payment.order_count} đơn liên kết</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-xl text-amber-600">
                                                        {formatCurrency(payment.total)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{new Date(payment.request_time).toLocaleTimeString('vi-VN')}</span>
                                                        <span className="text-xs text-muted-foreground">{new Date(payment.request_time).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-amber-500 hover:bg-amber-600 gap-1 animate-pulse">
                                                        <Clock className="size-3" />
                                                        Chờ thu ngân
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => printBill(payment)}
                                                            title="In tạm tính"
                                                        >
                                                            <Printer className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleViewDetail(payment)}
                                                        >
                                                            <Eye className="size-4 mr-1" />
                                                            Chi tiết
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleOpenPaymentDialog(payment)}
                                                        >
                                                            <Banknote className="size-4 mr-1" />
                                                            Thu tiền
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Unpaid Orders Tab */}
                <TabsContent value="unpaid">
                    <Card>
                        <CardHeader>
                            <CardTitle>Đang dùng bữa</CardTitle>
                            <CardDescription>
                                Theo dõi các khách đang dùng bữa nhưng chưa yêu cầu thanh toán (kiểm soát rủi ro).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingOrders ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-16 w-full" />
                                    ))}
                                </div>
                            ) : unpaidSessions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                    <CheckCircle className="size-12 text-green-500/50 mb-4" />
                                    <h3 className="text-lg font-medium text-foreground">Không có bàn nào đang ăn</h3>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Mã đơn</TableHead>
                                            <TableHead>Bàn</TableHead>
                                            <TableHead>Trạng thái chế biến</TableHead>
                                            <TableHead>Tổng tiền tạm tính</TableHead>
                                            <TableHead>Thời gian vào</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {unpaidSessions.map((session: OrderSessionSummary) => (
                                            <TableRow key={`${session.table_id}-${session.table_key}`}>
                                                <TableCell>
                                                    <span className="font-mono font-medium">{session.order_count} đơn</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">Bàn {session.table_id}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            session.status === "Hoàn thành" || session.status === "completed"
                                                                ? "default"
                                                                : session.status === "Đang nấu" || session.status === "cooking"
                                                                    ? "secondary"
                                                                    : "outline"
                                                        }
                                                    >
                                                        {session.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium text-muted-foreground">{formatCurrency(session.total_amount)}</span>
                                                </TableCell>
                                                <TableCell>{formatDate(session.last_order_time)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lịch sử thanh toán</CardTitle>
                            <CardDescription>Các giao dịch thanh toán thành công gần đây (Phiên hiện tại)</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {isLoadingHistory ? (
                                <div className="space-y-4">
                                    {[1, 2].map((i) => (
                                        <Skeleton key={i} className="h-16 w-full" />
                                    ))}
                                </div>
                            ) : !payHistory || payHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                    <Receipt className="size-12 opacity-20 mb-4" />
                                    <h3 className="text-lg font-medium text-foreground">Chưa có giao dịch nào</h3>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Mã giao dịch</TableHead>
                                            <TableHead>Mã đơn gốc</TableHead>
                                            <TableHead>Tổng số tiền</TableHead>
                                            <TableHead>Hình thức</TableHead>
                                            <TableHead>Thời gian</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payHistory.map((ph: PaymentHistory, idx: number) => (
                                            <TableRow key={ph.id ?? `ph-${idx}`}>
                                                <TableCell><span className="font-mono text-xs">TXN-{ph.id}</span></TableCell>
                                                <TableCell>Order #{ph.order_id}</TableCell>
                                                <TableCell><span className="font-semibold text-green-600">+{formatCurrency(ph.amount)}</span></TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="uppercase bg-slate-100 dark:bg-slate-800">
                                                        {ph.method === 'cash' ? 'Tiền mặt' : ph.method}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(ph.paid_at)}</TableCell>
                                                <TableCell>
                                                    <span title="Thành công"><CheckCircle className="size-4 text-green-500" /></span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Phiếu Tính Tiền - Bàn {selectedPayment?.table_id}</DialogTitle>
                        <DialogDescription>
                            Thông tin chi tiết về yêu cầu thanh toán
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Số bàn</p>
                                    <p className="font-semibold text-lg">Bàn {selectedPayment.table_id}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Các đơn gộp</p>
                                    <p className="font-semibold">{selectedPayment.order_count} đơn liên kết</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Thời gian khách báo</p>
                                    <p className="font-medium text-amber-600">{new Date(selectedPayment.request_time).toLocaleTimeString('vi-VN')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Mã YC</p>
                                    <p className="font-mono text-sm">#{selectedPayment.order_id}</p>
                                </div>
                            </div>
                            <div className="border-t pt-4 bg-muted/30 p-4 rounded-lg mt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-medium">Khách cần trả:</span>
                                    <span className="text-3xl font-black text-primary">
                                        {formatCurrency(selectedPayment.total)}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">Chi tiết món trong session</h4>
                                    <span className="text-sm text-muted-foreground">
                                        {selectedSessionOrders.length} đơn / {selectedSessionItems.length} món
                                    </span>
                                </div>
                                {selectedSessionItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Chưa tải được chi tiết món.</p>
                                ) : (
                                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                                        {selectedSessionItems.map((item: OrderItem & { order_id: number }, index: number) => (
                                            <div key={`${item.order_id}-${item.id}-${index}`} className="flex items-center justify-between gap-4 text-sm">
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{item.menu_item_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Đơn #{item.order_id} · SL {item.quantity}
                                                    </p>
                                                </div>
                                                <span className="font-medium whitespace-nowrap">
                                                    {formatCurrency(item.total ?? item.price * item.quantity)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => {
                            if (selectedPayment) printBill(selectedPayment);
                        }}>
                             <Printer className="size-4 mr-1" />
                             In Tạm Tính
                        </Button>
                        <Button
                             className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                            onClick={() => {
                                setDetailDialogOpen(false);
                                if (selectedPayment) {
                                    handleOpenPaymentDialog(selectedPayment);
                                }
                            }}
                        >
                            <Banknote className="size-5 mr-2" />
                            Xác Nhận Đã Nhận Tiền
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment Confirmation Dialog */}
            <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Banknote className="size-5 text-green-600" />
                            Xác nhận đã nhận tiền mặt
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4">
                                <p>Bạn chuẩn bị xác nhận hoàn tất giao dịch cho:</p>
                                {selectedPayment && (
                                    <div className="rounded-lg border bg-amber-500/5 p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Bàn:</span>
                                            <span className="font-semibold text-xl text-foreground">
                                                Bàn {selectedPayment.table_id}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                                            <span className="text-muted-foreground">Số tiền khách đưa:</span>
                                            <span className="text-2xl font-black text-green-600">
                                                {formatCurrency(selectedPayment.total)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm font-medium text-amber-600 bg-amber-500/10 p-2 rounded flex items-center gap-2">
                                    <AlertCircle className="size-4" />
                                    Hành động này sẽ xóa phiên bàn hiện tại và cho phép bàn nhận khách mới!
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Hủy bỏ</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleProcessPayment}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700 px-6 gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="size-4" />
                                    Xác nhận và In Hóa Đơn
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
