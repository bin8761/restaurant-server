"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { kitchenSocket } from "@/lib/socket";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  Flame,
  RefreshCw,
  Trash2,
  Play,
  Check,
  UtensilsCrossed,
} from "lucide-react";

// Types
interface KitchenItem {
  id: number;
  order_detail_id: number;
  order_id: number;
  table_name: string;
  food_name: string;
  food_image: string;
  quantity: number;
  status: string;
  updated_at: string;
}

interface KitchenStats {
  pending_count: number;
  cooking_count: number;
  completed_count: number;
  total_count: number;
}

// Fetcher function
const fetcher = (url: string) => api.get(url).then((res) => res.data);

const normalizeText = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .toLowerCase();

const getKitchenStatusKey = (status: string) => {
  const s = normalizeText(status);
  if (s.includes("cho") && s.includes("che bien")) return "pending";
  if (s.includes("dang") && (s.includes("che bien") || s.includes("nau") || s.includes("lam"))) return "cooking";
  if (s.includes("hoan thanh") || s.includes("da xong") || s.includes("xong")) return "completed";
  return "other";
};
export default function KitchenPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch kitchen queue
  const {
    data: queueItems = [],
    mutate: mutateQueue,
    isLoading: isLoadingQueue,
  } = useSWR<KitchenItem[]>("/kitchen/queue", fetcher, {
  });

  // Fetch kitchen stats
  const {
    data: stats,
    mutate: mutateStats,
    isLoading: isLoadingStats,
  } = useSWR<KitchenStats>("/kitchen/stats", fetcher, {
  });

  useEffect(() => {
    let mounted = true;

    kitchenSocket.connect(
      () => {
        if (!mounted) return;

        const refreshAll = () => {
          mutateQueue();
          mutateStats();
        };

        kitchenSocket.subscribe("/topic/kitchen.queue-updated", () => {
          if (!mounted) return;
          refreshAll();
        });

        kitchenSocket.subscribe("/topic/kitchen.new-order", () => {
          if (!mounted) return;
          refreshAll();
        });

        kitchenSocket.subscribe("/topic/kitchen.cleared", () => {
          if (!mounted) return;
          refreshAll();
        });

        kitchenSocket.subscribe("/topic/kitchen.item-delivered", () => {
          if (!mounted) return;
          refreshAll();
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
  }, [mutateQueue, mutateStats]);

  // Filter items based on active tab
  const filteredItems = queueItems.filter((item) => {
    if (activeTab === "all") return true;
    const key = getKitchenStatusKey(item.status);
    if (activeTab === "pending") return key === "pending";
    if (activeTab === "cooking") return key === "cooking";
    if (activeTab === "completed") return key === "completed";
    return true;
  });

  // Update item status
  const handleUpdateStatus = async (
    id: number,
    newStatus: "Đang chế biến" | "Hoàn thành"
  ) => {
    try {
      await api.put(`/kitchen/queue/${id}/status`, { status: newStatus });
      toast({
        title: "Cập nhật thành công",
        description: `Đã chuyển trạng thái sang "${newStatus}"`,
      });
      mutateQueue();
      mutateStats();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  // Clear completed items
  const handleClearCompleted = async () => {
    try {
      await api.delete("/kitchen/queue/completed");
      toast({
        title: "Dọn dẹp thành công",
        description: "Đã xóa tất cả món đã hoàn thành",
      });
      mutateQueue();
      mutateStats();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể dọn dẹp",
        variant: "destructive",
      });
    }
  };

  // Refresh data
  const handleRefresh = () => {
    mutateQueue();
    mutateStats();
    toast({
      title: "Đã làm mới",
      description: "Dữ liệu đã được cập nhật",
    });
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const key = getKitchenStatusKey(status);
    if (key === "pending") {
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          <Clock className="mr-1 size-3" />
          Chờ chế biến
        </Badge>
      );
    }
    if (key === "cooking") {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          <Flame className="mr-1 size-3" />
          Đang chế biến
        </Badge>
      );
    }
    if (key === "completed") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle2 className="mr-1 size-3" />
          Hoàn thành
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate time elapsed
  const getTimeElapsed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} giờ trước`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng món</CardTitle>
            <UtensilsCrossed className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? "..." : stats?.total_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Trong hàng đợi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ chế biến</CardTitle>
            <Clock className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {isLoadingStats ? "..." : stats?.pending_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Cần bắt đầu làm</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang chế biến</CardTitle>
            <Flame className="size-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {isLoadingStats ? "..." : stats?.cooking_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Đang nấu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <CheckCircle2 className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoadingStats ? "..." : stats?.completed_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Sẵn sàng phục vụ</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              Tất cả ({queueItems.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Chờ ({queueItems.filter((i) => i.status === "Chờ chế biến").length})
            </TabsTrigger>
            <TabsTrigger value="cooking">
              Đang làm ({queueItems.filter((i) => i.status === "Đang chế biến").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Xong ({queueItems.filter((i) => i.status === "Hoàn thành").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 size-4" />
            Làm mới
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!queueItems.some((i) => i.status === "Hoàn thành")}
              >
                <Trash2 className="mr-2 size-4" />
                Dọn dẹp
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận dọn dẹp</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc muốn xóa tất cả các món đã hoàn thành khỏi màn hình
                  bếp? Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearCompleted}>
                  Xác nhận
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Kitchen Queue */}
      {isLoadingQueue ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              Không có món nào trong hàng đợi
            </p>
            <p className="text-sm text-muted-foreground">
              Các món mới sẽ xuất hiện ở đây khi có đơn hàng
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`transition-all ${
                item.status === "Đang chế biến"
                  ? "ring-2 ring-orange-500"
                  : item.status === "Hoàn thành"
                  ? "opacity-75"
                  : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {item.table_name}
                    </Badge>
                    <CardTitle className="line-clamp-1 text-base">
                      {item.food_name}
                    </CardTitle>
                  </div>
                  <Badge className="shrink-0">x{item.quantity}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.food_image && (
                  <div className="aspect-video overflow-hidden rounded-md">
                    <img
                      src={item.food_image}
                      alt={item.food_name}
                      className="size-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {getStatusBadge(item.status)}
                  <span className="text-xs text-muted-foreground">
                    {getTimeElapsed(item.updated_at)}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Đơn #{item.order_id} - Chi tiết #{item.order_detail_id}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {item.status === "Chờ chế biến" && (
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() =>
                        handleUpdateStatus(item.id, "Đang chế biến")
                      }
                    >
                      <Play className="mr-2 size-4" />
                      Bắt đầu làm
                    </Button>
                  )}
                  {item.status === "Đang chế biến" && (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                      onClick={() => handleUpdateStatus(item.id, "Hoàn thành")}
                    >
                      <Check className="mr-2 size-4" />
                      Làm xong
                    </Button>
                  )}
                  {item.status === "Hoàn thành" && (
                    <div className="flex flex-1 items-center justify-center rounded-md bg-green-100 py-2 text-sm font-medium text-green-800">
                      <CheckCircle2 className="mr-2 size-4" />
                      Sẵn sàng phục vụ
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

