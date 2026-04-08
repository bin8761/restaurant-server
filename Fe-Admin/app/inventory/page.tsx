"use client";

import { useState } from "react";
import useSWR from "swr";
import {
    Package,
    Plus,
    Search,
    Edit,
    Trash2,
    AlertTriangle,
    RefreshCw,
    PackagePlus,
    PackageMinus,
    FileDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import * as XLSX from "xlsx";

// Types based on API
interface Ingredient {
    id: number;
    name: string;
    unit: string;
    quantity: number;
}

// Fetcher function
const fetcher = (url: string) => api.get(url).then((res) => res.data);

// Units list
const units = ["kg", "g", "lít", "ml", "cái", "hộp", "chai", "gói", "con"];

const formatDateYYYYMMDD = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
};

export default function InventoryPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    // Dialog states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        unit: "kg",
        quantity: 0,
    });

    const [stockAdjustData, setStockAdjustData] = useState({
        action: "add" as "add" | "subtract",
        amount: 0,
    });

    // Fetch all ingredients
    const {
        data: ingredients = [],
        mutate: mutateIngredients,
        isLoading: isLoadingIngredients,
    } = useSWR<Ingredient[]>("/inventory/ingredients", fetcher);

    // Fetch low stock ingredients
    const {
        data: lowStockItems = [],
        mutate: mutateLowStock,
        isLoading: isLoadingLowStock,
    } = useSWR<Ingredient[]>("/inventory/ingredients/low-stock", fetcher);

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            unit: "kg",
            quantity: 0,
        });
    };

    // Add new ingredient
    const handleAddItem = async () => {
        try {
            await api.post("/inventory/ingredients", formData);
            toast({
                title: "Thành công",
                description: "Đã thêm nguyên liệu mới",
            });
            mutateIngredients();
            mutateLowStock();
            setIsAddOpen(false);
            resetForm();
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể thêm nguyên liệu",
                variant: "destructive",
            });
        }
    };

    // Edit ingredient
    const handleEditItem = async () => {
        if (!selectedItem) return;
        try {
            await api.put(`/inventory/ingredients/${selectedItem.id}`, {
                name: formData.name,
                unit: formData.unit,
                quantity: formData.quantity,
            });
            toast({
                title: "Thành công",
                description: "Đã cập nhật nguyên liệu",
            });
            mutateIngredients();
            mutateLowStock();
            setIsEditOpen(false);
            setSelectedItem(null);
            resetForm();
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể cập nhật nguyên liệu",
                variant: "destructive",
            });
        }
    };

    // Delete ingredient
    const handleDeleteItem = async () => {
        if (!selectedItem) return;
        try {
            await api.delete(`/inventory/ingredients/${selectedItem.id}`);
            toast({
                title: "Thành công",
                description: "Đã xóa nguyên liệu",
            });
            mutateIngredients();
            mutateLowStock();
            setIsDeleteOpen(false);
            setSelectedItem(null);
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể xóa nguyên liệu",
                variant: "destructive",
            });
        }
    };

    // Adjust stock (add/subtract)
    const handleStockAdjust = async () => {
        if (!selectedItem) return;
        try {
            await api.put(`/inventory/ingredients/${selectedItem.id}/quantity`, {
                amount: stockAdjustData.amount,
                action: stockAdjustData.action,
            });
            toast({
                title: "Thành công",
                description:
                    stockAdjustData.action === "add" ? "Đã nhập kho" : "Đã xuất kho",
            });
            mutateIngredients();
            mutateLowStock();
            setIsStockAdjustOpen(false);
            setSelectedItem(null);
            setStockAdjustData({ action: "add", amount: 0 });
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể điều chỉnh số lượng",
                variant: "destructive",
            });
        }
    };

    // Open edit dialog
    const openEditDialog = (item: Ingredient) => {
        setSelectedItem(item);
        setFormData({
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
        });
        setIsEditOpen(true);
    };

    // Open stock adjust dialog
    const openStockAdjustDialog = (
        item: Ingredient,
        action: "add" | "subtract"
    ) => {
        setSelectedItem(item);
        setStockAdjustData({ action, amount: 0 });
        setIsStockAdjustOpen(true);
    };

    // Refresh data
    const handleRefresh = () => {
        mutateIngredients();
        mutateLowStock();
        toast({
            title: "Đã làm mới",
            description: "Dữ liệu đã được cập nhật",
        });
    };

    // Filter ingredients based on search and tab
    const filteredIngredients = ingredients.filter((item: Ingredient) => {
        const matchesSearch = item.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        if (activeTab === "low-stock") {
            return matchesSearch && lowStockItems.some((ls: Ingredient) => ls.id === item.id);
        }
        return matchesSearch;
    });

    const exportInventoryXlsx = (items: Ingredient[], mode: "all" | "low") => {
        if (!items.length) {
            toast({
                title: "Không có dữ liệu để xuất",
                variant: "destructive",
            });
            return;
        }

        const data = items.map((item) => ({
            ID: item.id,
            "Tên nguyên liệu": item.name,
            "Đơn vị": item.unit,
            "Số lượng tồn": `${item.quantity} ${item.unit}`,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Kho");

        const suffix = formatDateYYYYMMDD();
        const filename =
            mode === "low"
                ? `kho-sap-het-${suffix}.xlsx`
                : `kho-${suffix}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    // Stats
    const totalItems = ingredients.length;
    const lowStockCount = lowStockItems.length;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tổng nguyên liệu
                        </CardTitle>
                        <Package className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoadingIngredients ? "..." : totalItems}
                        </div>
                        <p className="text-xs text-muted-foreground">loại nguyên liệu</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Sắp hết hàng
                        </CardTitle>
                        <AlertTriangle className="size-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {isLoadingLowStock ? "..." : lowStockCount}
                        </div>
                        <p className="text-xs text-muted-foreground">cần nhập thêm</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
                        <RefreshCw className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">Hoạt động</div>
                        <p className="text-xs text-muted-foreground">Hệ thống kho</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <TabsList>
                        <TabsTrigger value="all">
                            <Package className="mr-2 size-4" />
                            Tất cả ({ingredients.length})
                        </TabsTrigger>
                        <TabsTrigger value="low-stock">
                            <AlertTriangle className="mr-2 size-4" />
                            Sắp hết ({lowStockItems.length})
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Tìm nguyên liệu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <FileDown className="mr-2 size-4" />
                                    Xuất Excel
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => exportInventoryXlsx(ingredients, "all")}>
                                    Toàn kho
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportInventoryXlsx(lowStockItems, "low")}>
                                    Sắp hết hàng
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" size="icon" onClick={handleRefresh}>
                            <RefreshCw className="size-4" />
                        </Button>
                        <Button onClick={() => setIsAddOpen(true)}>
                            <Plus className="mr-2 size-4" />
                            Thêm mới
                        </Button>
                    </div>
                </div>

                <TabsContent value="all" className="space-y-4">
                    <IngredientTable
                        items={filteredIngredients}
                        isLoading={isLoadingIngredients}
                        onEdit={openEditDialog}
                        onDelete={(item) => {
                            setSelectedItem(item);
                            setIsDeleteOpen(true);
                        }}
                        onStockAdjust={openStockAdjustDialog}
                    />
                </TabsContent>

                <TabsContent value="low-stock" className="space-y-4">
                    {lowStockItems.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Package className="mb-4 size-12 text-muted-foreground" />
                                <p className="text-lg font-medium text-muted-foreground">
                                    Không có nguyên liệu nào sắp hết
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Tất cả nguyên liệu đều đủ số lượng
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <IngredientTable
                            items={filteredIngredients}
                            isLoading={isLoadingLowStock}
                            onEdit={openEditDialog}
                            onDelete={(item) => {
                                setSelectedItem(item);
                                setIsDeleteOpen(true);
                            }}
                            onStockAdjust={openStockAdjustDialog}
                            isLowStock
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Add Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thêm nguyên liệu mới</DialogTitle>
                        <DialogDescription>
                            Đăng ký mới một mặt hàng nguyên liệu vào hệ thống
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Tên nguyên liệu</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="Nhập tên nguyên liệu"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="unit">Đơn vị</Label>
                                <Select
                                    value={formData.unit}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, unit: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn đơn vị" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {units.map((unit) => (
                                            <SelectItem key={unit} value={unit}>
                                                {unit}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Số lượng ban đầu</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={formData.quantity}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            quantity: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleAddItem} disabled={!formData.name}>
                            Thêm mới
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa nguyên liệu</DialogTitle>
                        <DialogDescription>
                            Cập nhật thông tin nguyên liệu
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Tên nguyên liệu</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-unit">Đơn vị</Label>
                                <Select
                                    value={formData.unit}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, unit: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn đơn vị" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {units.map((unit) => (
                                            <SelectItem key={unit} value={unit}>
                                                {unit}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-quantity">Số lượng</Label>
                                <Input
                                    id="edit-quantity"
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={formData.quantity}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            quantity: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleEditItem} disabled={!formData.name}>
                            Lưu thay đổi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stock Adjust Dialog */}
            <Dialog open={isStockAdjustOpen} onOpenChange={setIsStockAdjustOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {stockAdjustData.action === "add" ? "Nhập kho" : "Xuất kho"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedItem?.name} - Hiện có: {selectedItem?.quantity}{" "}
                            {selectedItem?.unit}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">
                                Số lượng {stockAdjustData.action === "add" ? "nhập" : "xuất"}
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                min="0"
                                step="0.1"
                                value={stockAdjustData.amount}
                                onChange={(e) =>
                                    setStockAdjustData({
                                        ...stockAdjustData,
                                        amount: parseFloat(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>
                        {stockAdjustData.action === "add" && selectedItem && (
                            <p className="text-sm text-muted-foreground">
                                Sau khi nhập: {selectedItem.quantity + stockAdjustData.amount}{" "}
                                {selectedItem.unit}
                            </p>
                        )}
                        {stockAdjustData.action === "subtract" && selectedItem && (
                            <p className="text-sm text-muted-foreground">
                                Sau khi xuất:{" "}
                                {Math.max(0, selectedItem.quantity - stockAdjustData.amount)}{" "}
                                {selectedItem.unit}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsStockAdjustOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleStockAdjust}
                            disabled={stockAdjustData.amount <= 0}
                            className={
                                stockAdjustData.action === "add"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                            }
                        >
                            {stockAdjustData.action === "add" ? (
                                <>
                                    <PackagePlus className="mr-2 size-4" />
                                    Nhập kho
                                </>
                            ) : (
                                <>
                                    <PackageMinus className="mr-2 size-4" />
                                    Xuất kho
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa nguyên liệu "{selectedItem?.name}"? Hành động
                            này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteItem}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Ingredient Table Component
function IngredientTable({
    items,
    isLoading,
    onEdit,
    onDelete,
    onStockAdjust,
    isLowStock = false,
}: {
    items: Ingredient[];
    isLoading: boolean;
    onEdit: (item: Ingredient) => void;
    onDelete: (item: Ingredient) => void;
    onStockAdjust: (item: Ingredient, action: "add" | "subtract") => void;
    isLowStock?: boolean;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="mb-4 size-12 text-muted-foreground" />
                    <p className="text-lg font-medium text-muted-foreground">
                        Không tìm thấy nguyên liệu
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Thử tìm kiếm với từ khóa khác
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Tên nguyên liệu</TableHead>
                            <TableHead>Đơn vị</TableHead>
                            <TableHead>Số lượng tồn</TableHead>
                            {isLowStock && <TableHead>Trạng thái</TableHead>}
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{item.unit}</Badge>
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`font-medium ${item.quantity <= 1
                                                ? "text-red-600"
                                                : item.quantity <= 5
                                                    ? "text-orange-600"
                                                    : "text-foreground"
                                            }`}
                                    >
                                        {item.quantity} {item.unit}
                                    </span>
                                </TableCell>
                                {isLowStock && (
                                    <TableCell>
                                        <Badge variant="destructive" className="bg-orange-500">
                                            <AlertTriangle className="mr-1 size-3" />
                                            Sắp hết
                                        </Badge>
                                    </TableCell>
                                )}
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onStockAdjust(item, "add")}
                                            title="Nhập kho"
                                        >
                                            <PackagePlus className="size-4 text-green-600" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onStockAdjust(item, "subtract")}
                                            title="Xuất kho"
                                        >
                                            <PackageMinus className="size-4 text-red-600" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(item)}
                                        >
                                            <Edit className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(item)}
                                        >
                                            <Trash2 className="size-4 text-destructive" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
