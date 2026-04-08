"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  ShoppingCart,
  UtensilsCrossed,
  CalendarCheck,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

// Types
interface Order {
  id: number;
  table_id: number;
  table_key: string;
  tableName?: string;
  status: string;
  total: number;
  order_time: string;
  details: Array<{
    food_id: number;
    quantity: number;
  }>;
}

interface Food {
  id: number;
  name: string;
  image: string;
}

interface TableData {
  id: number;
  name: string;
  status: string;
}

interface Payment {
  id: number;
  amount: number;
  paid_at: string;
}

interface KPIData {
  totalRevenue: number;
  todayOrders: number;
  occupiedTables: number;
  availableTables: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface TopFoodData {
  name: string;
  quantity: number;
}

interface OrderStatusCount {
  pending: number;
  cooking: number;
  completed: number;
}

// Helper functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Process data functions
const calculateKPIs = (
  orders: Order[],
  tables: TableData[],
  payments: Payment[]
): KPIData => {
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const todayOrders = orders.filter((o) => isToday(o.order_time)).length;
  const occupiedTables = tables.filter((t) => t.status === "Đang sử dụng").length;
  const availableTables = tables.filter((t) => t.status === "Trống").length;

  return { totalRevenue, todayOrders, occupiedTables, availableTables };
};

const calculateRevenueByDay = (payments: Payment[]): RevenueData[] => {
  const revenueMap = new Map<string, number>();

  payments.forEach((payment) => {
    const date = formatDate(payment.paid_at);
    revenueMap.set(date, (revenueMap.get(date) || 0) + payment.amount);
  });

  return Array.from(revenueMap.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);
};

const calculateTopFoods = (orders: Order[], foods: Food[]): TopFoodData[] => {
  const foodQuantityMap = new Map<number, number>();

  orders.forEach((order) => {
    order.details?.forEach((detail) => {
      foodQuantityMap.set(
        detail.food_id,
        (foodQuantityMap.get(detail.food_id) || 0) + detail.quantity
      );
    });
  });

  const foodMap = new Map(foods.map((f) => [f.id, f.name]));

  return Array.from(foodQuantityMap.entries())
    .map(([foodId, quantity]) => ({
      name: foodMap.get(foodId) || `Món ${foodId}`,
      quantity,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
};

const calculateOrderStatus = (orders: Order[]): OrderStatusCount => {
  return {
    pending: orders.filter((o) => o.status === "Chờ xác nhận").length,
    cooking: orders.filter((o) => o.status === "Đang nấu").length,
    completed: orders.filter((o) => o.status === "Hoàn thành").length,
  };
};

const getRecentOrders = (orders: Order[]): Order[] => {
  return [...orders]
    .sort((a, b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime())
    .slice(0, 5);
};

// Chart configs
const revenueChartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const topFoodsChartConfig = {
  quantity: {
    label: "Số lượng",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case "Chờ xác nhận":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "Đang nấu":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Hoàn thành":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyle()}`}>
      {status}
    </span>
  );
};

// Loading skeleton component
const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPIData>({
    totalRevenue: 0,
    todayOrders: 0,
    occupiedTables: 0,
    availableTables: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topFoods, setTopFoods] = useState<TopFoodData[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatusCount>({
    pending: 0,
    cooking: 0,
    completed: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setWarning(null);

      const [ordersResult, foodsResult, tablesResult, paymentsResult] = await Promise.allSettled([
        api.get("/orders"),
        api.get("/menu/foods"),
        api.get("/tables"),
        api.get("/payments/history"),
      ]);

      const failedSources: string[] = [];

      const extractData = <T,>(
        result: PromiseSettledResult<{ data: T }>,
        fallback: T,
        sourceLabel: string
      ): T => {
        if (result.status === "fulfilled") {
          return result.value.data ?? fallback;
        }
        const reason = result.reason as { message?: string } | undefined;
        failedSources.push(`${sourceLabel}: ${reason?.message || "Lỗi mạng"}`);
        return fallback;
      };

      const orders = extractData<Order[]>(ordersResult, [], "Orders");
      const foods = extractData<Food[]>(foodsResult, [], "Menu foods");
      const tables = extractData<TableData[]>(tablesResult, [], "Tables");
      const payments = extractData<Payment[]>(paymentsResult, [], "Payments");

      if (failedSources.length === 4) {
        setError("Không thể tải dữ liệu dashboard (lỗi mạng). Vui lòng kiểm tra API Gateway và các service backend.");
        return;
      }
      if (failedSources.length > 0) {
        setWarning(`Một số dữ liệu đang tạm thời không tải được: ${failedSources.join(" | ")}`);
      }

      const enrichedOrders = orders.map(o => ({
        ...o,
        tableName: tables.find(t => t.id === o.table_id)?.name || (o.table_key ? `Mã ${o.table_key.substring(0, 8)}` : `Bàn ${o.table_id}`)
      }));

      setKpis(calculateKPIs(enrichedOrders, tables, payments));
      setRevenueData(calculateRevenueByDay(payments));
      setTopFoods(calculateTopFoods(enrichedOrders, foods));
      setRecentOrders(getRecentOrders(enrichedOrders));
      setOrderStatus(calculateOrderStatus(enrichedOrders));
    } catch (err) {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {warning && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {warning}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Tổng thu từ thanh toán</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đơn hôm nay</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.todayOrders}</div>
            <p className="text-xs text-muted-foreground">Số đơn hàng trong ngày</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bàn đang phục vụ</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.occupiedTables}</div>
            <p className="text-xs text-muted-foreground">Đang có khách</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bàn trống</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.availableTables}</div>
            <p className="text-xs text-muted-foreground">Sẵn sàng phục vụ</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Doanh thu theo ngày
            </CardTitle>
            <CardDescription>7 ngày gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
              <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  className="text-xs"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-revenue)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Foods Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Top món bán chạy
            </CardTitle>
            <CardDescription>Top 5 món được gọi nhiều nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={topFoodsChartConfig} className="h-[300px] w-full">
              <BarChart data={topFoods} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={100}
                  className="text-xs"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="quantity" fill="var(--color-quantity)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Order Status */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Orders Table */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Đơn hàng gần nhất</CardTitle>
            <CardDescription>5 đơn hàng mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bàn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.tableName}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.order_time).toLocaleString("vi-VN")}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Chưa có đơn hàng
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Order Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái đơn hàng</CardTitle>
            <CardDescription>Tổng quan đơn hàng</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-sm">Chờ xác nhận</span>
              </div>
              <span className="font-semibold">{orderStatus.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm">Đang nấu</span>
              </div>
              <span className="font-semibold">{orderStatus.cooking}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-500" />
                <span className="text-sm">Hoàn thành</span>
              </div>
              <span className="font-semibold">{orderStatus.completed}</span>
            </div>
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Tổng số đơn</p>
              <p className="text-2xl font-bold">
                {orderStatus.pending + orderStatus.cooking + orderStatus.completed}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto refresh indicator */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3" />
        <span>Tự động cập nhật mỗi 30 giây</span>
        <Button variant="ghost" size="sm" onClick={fetchData} className="h-6 px-2">
          Làm mới
        </Button>
      </div>
    </div>
  );
}
