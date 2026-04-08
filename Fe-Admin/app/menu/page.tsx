"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Search,
    Plus,
    Trash2,
    Pencil,
    ImageIcon,
    RefreshCw,
    Filter,
    ChefHat,
    Tag,
    Package,
    Timer,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getUser, isAdminUser } from "@/lib/auth";
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
    DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

// Types
interface Ingredient {
    id: number;
    name: string;
    unit: string;
    amount: number;
}

interface Food {
    id: number;
    name: string;
    price: number;
    image_url: string;
    category_id: number;
    category_name: string;
    is_buffet_eligible: boolean;
    ingredients?: Ingredient[];
}

interface BuffetPackage {
    id: number;
    name: string;
    price: number;
    price_child: number;
    duration_minutes: number;
    description: string;
    food_ids?: number[];
    foods?: Food[];
}

interface Category {
    id: number;
    name: string;
}

// Helper functions
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
};

const normalizeImageUrl = (rawUrl?: string): string => {
    if (!rawUrl) return "";
    const value = rawUrl.trim();
    if (!value) return "";

    if (value.startsWith("/api/images/")) return value;
    if (value.startsWith("/image-service/uploads/")) {
        return `/api/images/${value.replace("/image-service/uploads/", "")}`;
    }
    if (value.startsWith("/uploads/")) {
        return `/api/images/${value.replace("/uploads/", "")}`;
    }
    if (value.startsWith("uploads/")) {
        return `/api/images/${value.replace("uploads/", "")}`;
    }
    if (!value.includes("/") && value.includes(".")) {
        return `/api/images/foods/${value}`;
    }

    const apiIdx = value.indexOf("/api/images/");
    if (apiIdx >= 0) return value.substring(apiIdx);
    const legacyIdx = value.indexOf("/image-service/uploads/");
    if (legacyIdx >= 0) return `/api/images/${value.substring(legacyIdx + "/image-service/uploads/".length)}`;
    const uploadsIdx = value.indexOf("/uploads/");
    if (uploadsIdx >= 0) return `/api/images/${value.substring(uploadsIdx + "/uploads/".length)}`;

    return value;
};

export default function MenuManagementPage() {
    // State for foods
    const [foods, setFoods] = useState<Food[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [isAdmin, setIsAdmin] = useState(false);

    // Dialog states
    const [isCreateFoodDialogOpen, setIsCreateFoodDialogOpen] = useState(false);
    const [isEditFoodDialogOpen, setIsEditFoodDialogOpen] = useState(false);
    const [isDeleteFoodDialogOpen, setIsDeleteFoodDialogOpen] = useState(false);
    const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
    const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
    const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);

    // Selected items
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedBuffetPackage, setSelectedBuffetPackage] = useState<BuffetPackage | null>(null);

    // Buffet Package states
    const [buffetPackages, setBuffetPackages] = useState<BuffetPackage[]>([]);
    const [isCreatePackageDialogOpen, setIsCreatePackageDialogOpen] = useState(false);
    const [isEditPackageDialogOpen, setIsEditPackageDialogOpen] = useState(false);
    const [isDeletePackageDialogOpen, setIsDeletePackageDialogOpen] = useState(false);

    // Form states
    const [formLoading, setFormLoading] = useState(false);
    const [foodForm, setFoodForm] = useState({
        name: "",
        price: 0,
        image_url: "",
        category_id: 0,
        is_buffet_eligible: true,
    });
    const [categoryForm, setCategoryForm] = useState({
        name: "",
    });
    const [packageForm, setPackageForm] = useState({
        name: "",
        price: 0,
        price_child: 0,
        duration_minutes: 120,
        description: "",
        food_ids: [] as number[],
    });

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [foodsRes, categoriesRes, packagesRes] = await Promise.all([
                api.get("/menu/foods"),
                api.get("/menu/categories"),
                api.get("/menu/buffet-packages"),
            ]);

            setFoods(foodsRes.data || []);
            setCategories(categoriesRes.data || []);
            setBuffetPackages(packagesRes.data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tải dữ liệu";
            setError(errorMessage);
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Check if user is admin
        setIsAdmin(isAdminUser());
        
        fetchData();
    }, [fetchData]);

    // Filter foods
    const filteredFoods = foods.filter((food) => {
        const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "all" || food.category_id === parseInt(filterCategory);
        return matchesSearch && matchesCategory;
    });

    // CRUD operations for Foods
    const handleCreateFood = async () => {
        if (!foodForm.name.trim()) {
            toast.error("Vui lòng nhập tên món ăn");
            return;
        }
        if (foodForm.price <= 0) {
            toast.error("Vui lòng nhập giá hợp lệ");
            return;
        }
        if (!foodForm.category_id) {
            toast.error("Vui lòng chọn danh mục");
            return;
        }

        setFormLoading(true);
        try {
            await api.post("/menu/foods", {
                name: foodForm.name,
                price: foodForm.price,
                image_url: foodForm.image_url || null,
                category_id: foodForm.category_id,
                is_buffet_eligible: foodForm.is_buffet_eligible,
            });
            toast.success("Tạo món ăn thành công");
            setIsCreateFoodDialogOpen(false);
            resetFoodForm();
            await fetchData();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi tạo món ăn";
            toast.error(errorMsg);
            console.error("Error creating food:", err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateFood = async () => {
        if (!selectedFood || !foodForm.name.trim()) {
            toast.error("Vui lòng nhập tên món ăn");
            return;
        }

        setFormLoading(true);
        try {
            await api.put(`/menu/foods/${selectedFood.id}`, {
                name: foodForm.name,
                price: foodForm.price,
                image_url: foodForm.image_url || null,
                category_id: foodForm.category_id,
                is_buffet_eligible: foodForm.is_buffet_eligible,
            });
            toast.success("Cập nhật món ăn thành công");
            setIsEditFoodDialogOpen(false);
            resetFoodForm();
            await fetchData();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi cập nhật món ăn";
            toast.error(errorMsg);
            console.error("Error updating food:", err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteFood = async () => {
        if (!selectedFood) return;

        setFormLoading(true);
        try {
            await api.delete(`/menu/foods/${selectedFood.id}`);
            toast.success("Xóa món ăn thành công");
            setIsDeleteFoodDialogOpen(false);
            setSelectedFood(null);
            await fetchData();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi xóa món ăn";
            toast.error(errorMsg);
            console.error("Error deleting food:", err);
        } finally {
            setFormLoading(false);
        }
    };

    // CRUD operations for Categories
    const handleCreateCategory = async () => {
        if (!categoryForm.name.trim()) {
            toast.error("Vui lòng nhập tên danh mục");
            return;
        }

        setFormLoading(true);
        try {
            await api.post("/menu/categories", {
                name: categoryForm.name,
            });
            toast.success("Tạo danh mục thành công");
            setIsCreateCategoryDialogOpen(false);
            resetCategoryForm();
            await fetchData();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi tạo danh mục";
            toast.error(errorMsg);
            console.error("Error creating category:", err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateCategory = async () => {
        if (!selectedCategory || !categoryForm.name.trim()) {
            toast.error("Vui lòng nhập tên danh mục");
            return;
        }

        setFormLoading(true);
        try {
            await api.put(`/menu/categories/${selectedCategory.id}`, {
                name: categoryForm.name,
            });
            toast.success("Cập nhật danh mục thành công");
            setIsEditCategoryDialogOpen(false);
            resetCategoryForm();
            await fetchData();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi cập nhật danh mục";
            toast.error(errorMsg);
            console.error("Error updating category:", err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategory) return;

        setFormLoading(true);
        try {
            await api.delete(`/menu/categories/${selectedCategory.id}`);
            toast.success("Xóa danh mục thành công");
            setIsDeleteCategoryDialogOpen(false);
            setSelectedCategory(null);
            await fetchData();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi xóa danh mục";
            toast.error(errorMsg);
            console.error("Error deleting category:", err);
        } finally {
            setFormLoading(false);
        }
    };

    // CRUD operations for Buffet Packages
    const handleCreatePackage = async () => {
        if (!packageForm.name.trim()) {
            toast.error("Vui lòng nhập tên gói");
            return;
        }
        setFormLoading(true);
        try {
            await api.post("/menu/buffet-packages", packageForm);
            toast.success("Tạo gói buffet thành công");
            setIsCreatePackageDialogOpen(false);
            resetPackageForm();
            await fetchData();
        } catch (err) {
            toast.error("Lỗi khi tạo gói buffet");
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdatePackage = async () => {
        if (!selectedBuffetPackage || !packageForm.name.trim()) return;
        setFormLoading(true);
        try {
            await api.put(`/menu/buffet-packages/${selectedBuffetPackage.id}`, packageForm);
            toast.success("Cập nhật thành công");
            setIsEditPackageDialogOpen(false);
            resetPackageForm();
            await fetchData();
        } catch (err) {
            toast.error("Lỗi khi cập nhật");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeletePackage = async () => {
        if (!selectedBuffetPackage) return;
        setFormLoading(true);
        try {
            await api.delete(`/menu/buffet-packages/${selectedBuffetPackage.id}`);
            toast.success("Xóa thành công");
            setIsDeletePackageDialogOpen(false);
            setSelectedBuffetPackage(null);
            await fetchData();
        } catch (err) {
            toast.error("Lỗi khi xóa");
        } finally {
            setFormLoading(false);
        }
    };

    // Form helpers
    const resetFoodForm = () => {
        setFoodForm({
            name: "",
            price: 0,
            image_url: "",
            category_id: 0,
            is_buffet_eligible: true,
        });
        setSelectedFood(null);
    };

    const resetCategoryForm = () => {
        setCategoryForm({ name: "" });
        setSelectedCategory(null);
    };

    const resetPackageForm = () => {
        setPackageForm({
            name: "",
            price: 0,
            price_child: 0,
            duration_minutes: 120,
            description: "",
            food_ids: [],
        });
        setSelectedBuffetPackage(null);
    };

    const openEditFoodDialog = (food: Food) => {
        setSelectedFood(food);
        setFoodForm({
            name: food.name,
            price: food.price,
            image_url: food.image_url || "",
            category_id: food.category_id,
            is_buffet_eligible: food.is_buffet_eligible ?? true,
        });
        setIsEditFoodDialogOpen(true);
    };

    const openDeleteFoodDialog = (food: Food) => {
        setSelectedFood(food);
        setIsDeleteFoodDialogOpen(true);
    };

    const openEditCategoryDialog = (category: Category) => {
        setSelectedCategory(category);
        setCategoryForm({ name: category.name });
        setIsEditCategoryDialogOpen(true);
    };

    const openDeleteCategoryDialog = (category: Category) => {
        setSelectedCategory(category);
        setIsDeleteCategoryDialogOpen(true);
    };

    const openEditPackageDialog = (pkg: BuffetPackage) => {
        setSelectedBuffetPackage(pkg);
        setPackageForm({
            name: pkg.name,
            price: pkg.price,
            price_child: pkg.price_child,
            duration_minutes: pkg.duration_minutes,
            description: pkg.description || "",
            food_ids: pkg.food_ids || [],
        });
        setIsEditPackageDialogOpen(true);
    };

    const openDeletePackageDialog = (pkg: BuffetPackage) => {
        setSelectedBuffetPackage(pkg);
        setIsDeletePackageDialogOpen(true);
    };

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-10 flex-1 max-w-md" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-64 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="foods" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="foods" className="gap-2">
                        <ChefHat className="h-4 w-4" />
                        Món ăn
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-2">
                        <Tag className="h-4 w-4" />
                        Danh mục
                    </TabsTrigger>
                    <TabsTrigger value="buffet-packages" className="gap-2">
                        <Timer className="h-4 w-4" />
                        Gói Buffet
                    </TabsTrigger>
                </TabsList>

                {/* Foods Tab */}
                <TabsContent value="foods" className="space-y-6">
                    {/* Header & Filters */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex flex-1 items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm món ăn..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="w-48">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Lọc theo danh mục" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={fetchData}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                            <Dialog open={isCreateFoodDialogOpen} onOpenChange={setIsCreateFoodDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={resetFoodForm}>
                                        <Plus className="h-4 w-4" />
                                        Thêm món
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Thêm món ăn mới</DialogTitle>
                                        <DialogDescription>Điền thông tin để tạo món ăn mới</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="food-name">Tên món ăn</Label>
                                            <Input
                                                id="food-name"
                                                placeholder="VD: Phở Bò, Cơm tấm..."
                                                value={foodForm.name || ""}
                                                onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="food-price">Giá (VND)</Label>
                                            <Input
                                                id="food-price"
                                                type="number"
                                                min="0"
                                                step="1000"
                                                placeholder="55000"
                                                value={foodForm.price || ""}
                                                onChange={(e) => setFoodForm({ ...foodForm, price: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="food-category">Danh mục</Label>
                                            <Select
                                                value={foodForm.category_id ? foodForm.category_id.toString() : ""}
                                                onValueChange={(value) => setFoodForm({ ...foodForm, category_id: parseInt(value) })}
                                            >
                                                <SelectTrigger id="food-category">
                                                    <SelectValue placeholder="Chọn danh mục" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category.id} value={category.id.toString()}>
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="food-image">Link hình ảnh</Label>
                                            <Input
                                                id="food-image"
                                                placeholder="https://example.com/image.jpg"
                                                value={foodForm.image_url || ""}
                                                onChange={(e) => setFoodForm({ ...foodForm, image_url: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="food-buffet">Cho phép gọi món Buffet</Label>
                                            <Switch
                                                id="food-buffet"
                                                checked={foodForm.is_buffet_eligible}
                                                onCheckedChange={(checked) => setFoodForm({ ...foodForm, is_buffet_eligible: checked })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsCreateFoodDialogOpen(false)}>
                                            Hủy
                                        </Button>
                                        <Button onClick={handleCreateFood} disabled={formLoading}>
                                            {formLoading ? "Đang tạo..." : "Tạo món"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            )}
                        </div>
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex justify-between items-center">
                            <div>
                                <p className="font-medium text-destructive">Lỗi</p>
                                <p className="text-sm text-destructive/80">{error}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchData}>
                                Thử lại
                            </Button>
                        </div>
                    )}

                    {/* Foods Grid */}
                    {filteredFoods.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Package className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                {searchQuery || filterCategory !== "all" ? "Không tìm thấy món ăn nào" : "Chưa có món ăn nào"}
                            </p>
                            <Button variant="link" onClick={() => setIsCreateFoodDialogOpen(true)}>
                                Thêm món ăn đầu tiên
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredFoods.map((food) => (
                                <Card key={food.id} className="overflow-hidden group hover:shadow-lg transition-shadow flex flex-col h-full">
                                    {/* Aspect-ratio container: padding-bottom = 60% ensures uniform height */}
                                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted flex-shrink-0">
                                        {food.image_url ? (
                                            <img
                                                src={normalizeImageUrl(food.image_url)}
                                                alt={food.name}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                            </div>
                                        )}

                                        {/* Overlay */}
                                        {isAdmin && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => openEditFoodDialog(food)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => openDeleteFoodDialog(food)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        )}
                                        {food.is_buffet_eligible && (
                                            <Badge className="absolute top-2 right-2 bg-purple-600/90 text-white border-0 text-[10px] h-5">
                                                BUFFET
                                            </Badge>
                                        )}
                                    </div>
                                    <CardContent className="p-4 flex flex-col justify-between h-full">                                        <h3 className="font-semibold text-foreground line-clamp-2 min-h-[48px] mb-2">{food.name}</h3>
                                        <div className="flex items-center justify-between mt-auto">
                                            <Badge variant="secondary" className="text-xs truncate max-w-[55%]">{food.category_name}</Badge>
                                            <span className="font-bold text-primary text-sm whitespace-nowrap">{formatCurrency(food.price)}</span>
                                        </div>
                                        {food.ingredients && food.ingredients.length > 0 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {food.ingredients.length} nguyên liệu
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Categories Tab */}
                <TabsContent value="categories" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Quản lý các danh mục món ăn trong nhà hàng
                        </p>
                        {isAdmin && (
                        <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={resetCategoryForm}>
                                    <Plus className="h-4 w-4" />
                                    Thêm danh mục
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Thêm danh mục mới</DialogTitle>
                                    <DialogDescription>Điền tên danh mục để tạo mới</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category-name">Tên danh mục</Label>
                                        <Input
                                            id="category-name"
                                            placeholder="VD: Món Chính, Tráng miệng..."
                                            value={categoryForm.name || ""}
                                            onChange={(e) => setCategoryForm({ name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateCategoryDialogOpen(false)}>
                                        Hủy
                                    </Button>
                                    <Button onClick={handleCreateCategory} disabled={formLoading}>
                                        {formLoading ? "Đang tạo..." : "Tạo danh mục"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        )}
                    </div>

                    {/* Categories Table */}
                    {categories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Chưa có danh mục nào</p>
                            <Button variant="link" onClick={() => setIsCreateCategoryDialogOpen(true)}>
                                Thêm danh mục đầu tiên
                            </Button>
                        </div>
                    ) : (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">ID</TableHead>
                                        <TableHead>Tên danh mục</TableHead>
                                        <TableHead className="w-24">Số món</TableHead>
                                        <TableHead className="w-32 text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.map((category) => {
                                        const foodCount = foods.filter((f) => f.category_id === category.id).length;
                                        return (
                                            <TableRow key={category.id}>
                                                <TableCell className="font-medium">{category.id}</TableCell>
                                                <TableCell>{category.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{foodCount} món</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isAdmin && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEditCategoryDialog(category)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openDeleteCategoryDialog(category)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </TabsContent>

            {/* Edit Food Dialog */}
            <Dialog open={isEditFoodDialogOpen} onOpenChange={setIsEditFoodDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa món ăn</DialogTitle>
                        <DialogDescription>Cập nhật thông tin món ăn</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-food-name">Tên món ăn</Label>
                            <Input
                                id="edit-food-name"
                                value={foodForm.name || ""}
                                onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-food-price">Giá (VND)</Label>
                            <Input
                                id="edit-food-price"
                                type="number"
                                min="0"
                                step="1000"
                                value={foodForm.price || ""}
                                onChange={(e) => setFoodForm({ ...foodForm, price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-food-category">Danh mục</Label>
                            <Select
                                value={foodForm.category_id ? foodForm.category_id.toString() : ""}
                                onValueChange={(value) => setFoodForm({ ...foodForm, category_id: parseInt(value) })}
                            >
                                <SelectTrigger id="edit-food-category">
                                    <SelectValue placeholder="Chọn danh mục" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-food-image">Link hình ảnh</Label>
                            <Input
                                id="edit-food-image"
                                value={foodForm.image_url || ""}
                                onChange={(e) => setFoodForm({ ...foodForm, image_url: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="edit-food-buffet">Cho phép gọi món Buffet</Label>
                            <Switch
                                id="edit-food-buffet"
                                checked={foodForm.is_buffet_eligible}
                                onCheckedChange={(checked) => setFoodForm({ ...foodForm, is_buffet_eligible: checked })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditFoodDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleUpdateFood} disabled={formLoading}>
                            {formLoading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Food Dialog */}
            <AlertDialog open={isDeleteFoodDialogOpen} onOpenChange={setIsDeleteFoodDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa món ăn</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa món &quot;{selectedFood?.name}&quot;? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteFood}
                            disabled={formLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {formLoading ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Category Dialog */}
            <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa danh mục</DialogTitle>
                        <DialogDescription>Cập nhật tên danh mục</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-category-name">Tên danh mục</Label>
                            <Input
                                id="edit-category-name"
                                value={categoryForm.name || ""}
                                onChange={(e) => setCategoryForm({ name: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleUpdateCategory} disabled={formLoading}>
                            {formLoading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Category Dialog */}
            <AlertDialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa danh mục</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa danh mục &quot;{selectedCategory?.name}&quot;? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCategory}
                            disabled={formLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {formLoading ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

                {/* Buffet Packages Tab */}
                <TabsContent value="buffet-packages" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Quản lý các gói Buffet (Giá người lớn, trẻ em và thời gian hiệu lực)
                        </p>
                        {isAdmin && (
                            <Dialog open={isCreatePackageDialogOpen} onOpenChange={setIsCreatePackageDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={resetPackageForm} className="bg-purple-600 hover:bg-purple-700 text-white">
                                        <Plus className="h-4 w-4" />
                                        Thêm gói Buffet
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Thêm gói Buffet mới</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                        <div className="col-span-2 space-y-2">
                                            <Label>Tên gói</Label>
                                            <Input value={packageForm.name || ""} onChange={(e) => setPackageForm({...packageForm, name: e.target.value})} placeholder="VD: Buffet Nướng 299k" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Giá Người lớn</Label>
                                            <Input type="number" value={packageForm.price || ""} onChange={(e) => setPackageForm({...packageForm, price: parseFloat(e.target.value) || 0})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Giá Trẻ em</Label>
                                            <Input type="number" value={packageForm.price_child || ""} onChange={(e) => setPackageForm({...packageForm, price_child: parseFloat(e.target.value) || 0})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Thời lượng (phút)</Label>
                                            <Input type="number" value={packageForm.duration_minutes || ""} onChange={(e) => setPackageForm({...packageForm, duration_minutes: parseInt(e.target.value) || 0})} />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>Mô tả</Label>
                                            <Textarea value={packageForm.description || ""} onChange={(e) => setPackageForm({...packageForm, description: e.target.value})} />
                                        </div>
                                        <div className="col-span-2 space-y-2 pt-2 border-t">
                                            <Label className="text-purple-700 font-bold">Danh sách món ăn bao gồm ({packageForm.food_ids?.length || 0})</Label>
                                            <div className="border rounded-md p-3 max-h-[180px] overflow-y-auto grid grid-cols-2 gap-2 bg-slate-50/50">
                                                {foods.filter(f => f.is_buffet_eligible).length === 0 ? (
                                                    <p className="col-span-2 text-center py-4 text-xs text-muted-foreground">Chưa có món ăn nào được đánh dấu là "Buffet Eligible"</p>
                                                ) : (
                                                    foods.filter(f => f.is_buffet_eligible).map(food => (
                                                        <div key={food.id} className="flex items-center space-x-2 p-1 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-100">
                                                            <Switch 
                                                                id={`food-pkg-${food.id}`}
                                                                checked={packageForm.food_ids?.includes(food.id)}
                                                                onCheckedChange={(checked) => {
                                                                    const newIds = checked 
                                                                        ? [...(packageForm.food_ids || []), food.id]
                                                                        : (packageForm.food_ids || []).filter(id => id !== food.id);
                                                                    setPackageForm({ ...packageForm, food_ids: newIds });
                                                                }}
                                                            />
                                                            <div className="flex flex-col">
                                                                <Label htmlFor={`food-pkg-${food.id}`} className="text-[11px] font-medium leading-none cursor-pointer">
                                                                    {food.name}
                                                                </Label>
                                                                <span className="text-[10px] text-muted-foreground">{formatCurrency(food.price)}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <p className="text-[9px] text-muted-foreground italic">
                                                * Chỉ hiển thị các món có đánh dấu "Cho phép gọi món Buffet" trong phần quản lý món ăn.
                                            </p>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsCreatePackageDialogOpen(false)}>Hủy</Button>
                                        <Button onClick={handleCreatePackage} disabled={formLoading} className="bg-purple-600 hover:bg-purple-700">Tạo mới</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {buffetPackages.map((pkg) => (
                            <Card key={pkg.id} className="relative border-l-4 border-l-purple-600">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold">{pkg.name}</h3>
                                            <p className="text-sm text-muted-foreground">{pkg.duration_minutes} phút</p>
                                        </div>
                                        {isAdmin && (
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEditPackageDialog(pkg)}><Pencil className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" onClick={() => openDeletePackageDialog(pkg)} className="text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Người lớn:</span>
                                            <span className="font-bold text-primary">{formatCurrency(pkg.price)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Trẻ em:</span>
                                            <span className="font-bold text-blue-600">{formatCurrency(pkg.price_child)}</span>
                                        </div>
                                    </div>
                                    {pkg.description && (
                                        <p className="mt-4 text-xs text-muted-foreground line-clamp-2 italic border-t pt-2">
                                            {pkg.description}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Edit Package Dialog */}
            <Dialog open={isEditPackageDialogOpen} onOpenChange={setIsEditPackageDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Sửa gói {selectedBuffetPackage?.name}</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2 space-y-2">
                            <Label>Tên gói</Label>
                            <Input value={packageForm.name || ""} onChange={(e) => setPackageForm({...packageForm, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Giá Người lớn</Label>
                            <Input type="number" value={packageForm.price || ""} onChange={(e) => setPackageForm({...packageForm, price: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Giá Trẻ em</Label>
                            <Input type="number" value={packageForm.price_child || ""} onChange={(e) => setPackageForm({...packageForm, price_child: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Thời lượng (phút)</Label>
                            <Input type="number" value={packageForm.duration_minutes || ""} onChange={(e) => setPackageForm({...packageForm, duration_minutes: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Mô tả</Label>
                            <Textarea value={packageForm.description || ""} onChange={(e) => setPackageForm({...packageForm, description: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-2 pt-2 border-t">
                            <Label className="text-purple-700 font-bold">Danh sách món ăn bao gồm ({packageForm.food_ids?.length || 0})</Label>
                            <div className="border rounded-md p-3 max-h-[180px] overflow-y-auto grid grid-cols-2 gap-2 bg-slate-50/50">
                                {foods.filter(f => f.is_buffet_eligible).length === 0 ? (
                                    <p className="col-span-2 text-center py-4 text-xs text-muted-foreground">Chưa có món ăn nào được đánh dấu là "Buffet Eligible"</p>
                                ) : (
                                    foods.filter(f => f.is_buffet_eligible).map(food => (
                                        <div key={food.id} className="flex items-center space-x-2 p-1 hover:bg-white rounded transition-colors border border-transparent hover:border-slate-100">
                                            <Switch 
                                                id={`edit-food-pkg-${food.id}`}
                                                checked={packageForm.food_ids?.includes(food.id)}
                                                onCheckedChange={(checked) => {
                                                    const newIds = checked 
                                                        ? [...(packageForm.food_ids || []), food.id]
                                                        : (packageForm.food_ids || []).filter(id => id !== food.id);
                                                    setPackageForm({ ...packageForm, food_ids: newIds });
                                                }}
                                            />
                                            <div className="flex flex-col">
                                                <Label htmlFor={`edit-food-pkg-${food.id}`} className="text-[11px] font-medium leading-none cursor-pointer">
                                                    {food.name}
                                                </Label>
                                                <span className="text-[10px] text-muted-foreground">{formatCurrency(food.price)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <p className="text-[9px] text-muted-foreground italic">
                                * Chỉ hiển thị các món có đánh dấu "Cho phép gọi món Buffet" trong phần quản lý món ăn.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditPackageDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleUpdatePackage} disabled={formLoading} className="bg-purple-600 hover:bg-purple-700">Lưu thay đổi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Package AlertDialog */}
            <AlertDialog open={isDeletePackageDialogOpen} onOpenChange={setIsDeletePackageDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa gói Buffet?</AlertDialogTitle>
                        <AlertDialogDescription>Xóa gói &quot;{selectedBuffetPackage?.name}&quot; sẽ không thể hoàn tác.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePackage} disabled={formLoading} className="bg-destructive text-white">Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
