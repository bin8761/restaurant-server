"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Search,
    Plus,
    Trash2,
    Pencil,
    RefreshCw,
    Users,
    UserCog,
    Shield,
    Phone,
    Mail,
    MapPin,
    Calendar,
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
import { Label } from "@/components/ui/label";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

// Types
interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    username: string;
    role_id: number;
    role_name: string;
    full_name: string;
    phone_number: string;
    age: number;
    email: string;
    address: string;
    created_at: string;
    updated_at: string;
}

const normalizeUser = (raw: any): User => ({
    id: raw.id,
    username: raw.username || "",
    role_id: raw.role_id ?? raw.roleId ?? 0,
    role_name: raw.role_name ?? raw.roleName ?? "UNKNOWN",
    full_name: raw.full_name ?? raw.fullName ?? "",
    phone_number: raw.phone_number ?? raw.phoneNumber ?? "",
    age: raw.age ?? 0,
    email: raw.email ?? "",
    address: raw.address ?? "",
    created_at: raw.created_at ?? raw.createdAt ?? "",
    updated_at: raw.updated_at ?? raw.updatedAt ?? "",
});

// Helper functions
const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const getRoleBadgeColor = (roleName: string): string => {
    switch (roleName.toUpperCase()) {
        case "ADMIN":
            return "bg-red-500/10 text-red-600 border-red-500/20";
        case "STAFF":
            return "bg-blue-500/10 text-blue-600 border-blue-500/20";
        default:
            return "bg-muted text-muted-foreground";
    }
};

const getInitials = (name: string): string => {
    if (!name) return "NA";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

export default function StaffManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("all");

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    // Selected user
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form states
    const [formLoading, setFormLoading] = useState(false);
    const [userForm, setUserForm] = useState({
        username: "",
        password: "",
        role_id: 2,
        full_name: "",
        phone_number: "",
        age: 0,
        email: "",
        address: "",
    });

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const usersRes = await api.get("/users");
            
            // API Gateway doesn't route /api/roles temporarily, so we hardcode the 2 system roles
            const rolesData: Role[] = [
                { id: 1, name: "ADMIN" },
                { id: 2, name: "STAFF" }
            ];

            const normalizedUsers: User[] = Array.isArray(usersRes.data)
                ? usersRes.data.map(normalizeUser)
                : [];
            setUsers(normalizedUsers);
            setRoles(rolesData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Không thể tải dữ liệu";
            setError(errorMessage);
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter users
    const filteredUsers = users.filter((user) => {
        const q = searchQuery.toLowerCase();
        const fullName = (user.full_name || "").toLowerCase();
        const username = (user.username || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const matchesSearch =
            fullName.includes(q) ||
            username.includes(q) ||
            email.includes(q);
        const matchesRole = filterRole === "all" || user.role_id === parseInt(filterRole);
        return matchesSearch && matchesRole;
    });

    // CRUD operations
    const handleCreateUser = async () => {
        if (!userForm.username.trim()) {
            toast.error("Vui lòng nhập tên đăng nhập");
            return;
        }
        if (!userForm.password.trim()) {
            toast.error("Vui lòng nhập mật khẩu");
            return;
        }
        if (!userForm.full_name.trim()) {
            toast.error("Vui lòng nhập họ tên");
            return;
        }

        setFormLoading(true);
        try {
            await api.post("/users", {
                username: userForm.username,
                password: userForm.password,
                role_id: userForm.role_id,
                full_name: userForm.full_name,
                phone_number: userForm.phone_number || null,
                age: userForm.age || null,
                email: userForm.email || null,
                address: userForm.address || null,
            });
            toast.success("Tạo nhân viên thành công");
            setIsCreateDialogOpen(false);
            resetForm();
            await fetchData();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi tạo nhân viên";
            toast.error(errorMsg);
            console.error("Error creating user:", err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser || !userForm.full_name.trim()) {
            toast.error("Vui lòng nhập họ tên");
            return;
        }

        setFormLoading(true);
        try {
            await api.put(`/users/${selectedUser.id}`, {
                role_id: userForm.role_id,
                full_name: userForm.full_name,
                phone_number: userForm.phone_number || null,
                age: userForm.age || null,
                email: userForm.email || null,
                address: userForm.address || null,
            });
            toast.success("Cập nhật nhân viên thành công");
            setIsEditDialogOpen(false);
            resetForm();
            await fetchData();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi cập nhật nhân viên";
            toast.error(errorMsg);
            console.error("Error updating user:", err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        setFormLoading(true);
        try {
            await api.delete(`/users/${selectedUser.id}`);
            toast.success("Xóa nhân viên thành công");
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
            await fetchData();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Lỗi khi xóa nhân viên";
            toast.error(errorMsg);
            console.error("Error deleting user:", err);
        } finally {
            setFormLoading(false);
        }
    };

    // Form helpers
    const resetForm = () => {
        setUserForm({
            username: "",
            password: "",
            role_id: 2,
            full_name: "",
            phone_number: "",
            age: 0,
            email: "",
            address: "",
        });
        setSelectedUser(null);
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setUserForm({
            username: user.username,
            password: "",
            role_id: user.role_id,
            full_name: user.full_name,
            phone_number: user.phone_number || "",
            age: user.age || 0,
            email: user.email || "",
            address: user.address || "",
        });
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (user: User) => {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    const openDetailDialog = (user: User) => {
        setSelectedUser(user);
        setIsDetailDialogOpen(true);
    };

    // Stats
    const stats = {
        total: users.length,
        admins: users.filter((u) => (u.role_name || "").toUpperCase() === "ADMIN").length,
        staff: users.filter((u) => (u.role_name || "").toUpperCase() === "STAFF").length,
    };

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tổng nhân viên</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Quản trị viên</CardTitle>
                        <Shield className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Nhân viên</CardTitle>
                        <UserCog className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.staff}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-1 items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo tên, username, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                    {role.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm}>
                                <Plus className="h-4 w-4" />
                                Thêm nhân viên
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Thêm nhân viên mới</DialogTitle>
                                <DialogDescription>Điền thông tin để tạo tài khoản nhân viên</DialogDescription>
                            </DialogHeader>
                            <FieldGroup className="gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="username">Tên đăng nhập *</FieldLabel>
                                        <Input
                                            id="username"
                                            placeholder="staff_name"
                                            value={userForm.username}
                                            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="password">Mật khẩu *</FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="********"
                                            value={userForm.password}
                                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        />
                                    </Field>
                                </div>
                                <Field>
                                    <FieldLabel htmlFor="full_name">Họ và tên *</FieldLabel>
                                    <Input
                                        id="full_name"
                                        placeholder="Nguyễn Văn A"
                                        value={userForm.full_name}
                                        onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                                    />
                                </Field>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="role">Vai trò</FieldLabel>
                                        <Select
                                            value={userForm.role_id.toString()}
                                            onValueChange={(value) => setUserForm({ ...userForm, role_id: parseInt(value) })}
                                        >
                                            <SelectTrigger id="role">
                                                <SelectValue placeholder="Chọn vai trò" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role.id} value={role.id.toString()}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="age">Tuổi</FieldLabel>
                                        <Input
                                            id="age"
                                            type="number"
                                            min="18"
                                            max="100"
                                            placeholder="25"
                                            value={userForm.age || ""}
                                            onChange={(e) => setUserForm({ ...userForm, age: parseInt(e.target.value) || 0 })}
                                        />
                                    </Field>
                                </div>
                                <Field>
                                    <FieldLabel htmlFor="email">Email</FieldLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="email@example.com"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
                                    <Input
                                        id="phone"
                                        placeholder="0987654321"
                                        value={userForm.phone_number}
                                        onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="address">Địa chỉ</FieldLabel>
                                    <Input
                                        id="address"
                                        placeholder="Hà Nội"
                                        value={userForm.address}
                                        onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                                    />
                                </Field>
                            </FieldGroup>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Hủy
                                </Button>
                                <Button onClick={handleCreateUser} disabled={formLoading}>
                                    {formLoading ? "Đang tạo..." : "Tạo nhân viên"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                        {searchQuery || filterRole !== "all" ? "Không tìm thấy nhân viên nào" : "Chưa có nhân viên nào"}
                    </p>
                    <Button variant="link" onClick={() => setIsCreateDialogOpen(true)}>
                        Thêm nhân viên đầu tiên
                    </Button>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nhân viên</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Liên hệ</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="w-28 text-center">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id} className="cursor-pointer" onClick={() => openDetailDialog(user)}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {getInitials(user.full_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.full_name}</p>
                                                {user.age && <p className="text-xs text-muted-foreground">{user.age} tuổi</p>}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{user.username}</TableCell>
                                    <TableCell>
                                        <Badge className={getRoleBadgeColor(user.role_name)}>{user.role_name}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {user.email && (
                                                <p className="text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email}
                                                </p>
                                            )}
                                            {user.phone_number && (
                                                <p className="text-muted-foreground flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {user.phone_number}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)} title="Chỉnh sửa">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDeleteDialog(user)}
                                                title="Xóa"
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa nhân viên</DialogTitle>
                        <DialogDescription>Cập nhật thông tin cho {selectedUser?.full_name}</DialogDescription>
                    </DialogHeader>
                    <FieldGroup className="gap-4">
                        <Field>
                            <FieldLabel htmlFor="edit-full_name">Họ và tên *</FieldLabel>
                            <Input
                                id="edit-full_name"
                                placeholder="Nguyễn Văn A"
                                value={userForm.full_name}
                                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel htmlFor="edit-role">Vai trò</FieldLabel>
                                <Select
                                    value={userForm.role_id.toString()}
                                    onValueChange={(value) => setUserForm({ ...userForm, role_id: parseInt(value) })}
                                >
                                    <SelectTrigger id="edit-role">
                                        <SelectValue placeholder="Chọn vai trò" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id.toString()}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="edit-age">Tuổi</FieldLabel>
                                <Input
                                    id="edit-age"
                                    type="number"
                                    min="18"
                                    max="100"
                                    placeholder="25"
                                    value={userForm.age || ""}
                                    onChange={(e) => setUserForm({ ...userForm, age: parseInt(e.target.value) || 0 })}
                                />
                            </Field>
                        </div>
                        <Field>
                            <FieldLabel htmlFor="edit-email">Email</FieldLabel>
                            <Input
                                id="edit-email"
                                type="email"
                                placeholder="email@example.com"
                                value={userForm.email}
                                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="edit-phone">Số điện thoại</FieldLabel>
                            <Input
                                id="edit-phone"
                                placeholder="0987654321"
                                value={userForm.phone_number}
                                onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="edit-address">Địa chỉ</FieldLabel>
                            <Input
                                id="edit-address"
                                placeholder="Hà Nội"
                                value={userForm.address}
                                onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                            />
                        </Field>
                    </FieldGroup>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleUpdateUser} disabled={formLoading}>
                            {formLoading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa nhân viên</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa tài khoản của <strong>{selectedUser?.full_name}</strong>?<br />
                            Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            disabled={formLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {formLoading ? "Đang xóa..." : "Xóa nhân viên"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* User Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Thông tin nhân viên</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                        {getInitials(selectedUser.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-semibold">{selectedUser.full_name}</h3>
                                    <p className="text-muted-foreground">@{selectedUser.username}</p>
                                    <Badge className={`mt-1 ${getRoleBadgeColor(selectedUser.role_name)}`}>
                                        {selectedUser.role_name}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {selectedUser.email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedUser.email}</span>
                                    </div>
                                )}
                                {selectedUser.phone_number && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedUser.phone_number}</span>
                                    </div>
                                )}
                                {selectedUser.address && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedUser.address}</span>
                                    </div>
                                )}
                                {selectedUser.age && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedUser.age} tuổi</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Tham gia: {formatDate(selectedUser.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                            Đóng
                        </Button>
                        <Button
                            onClick={() => {
                                setIsDetailDialogOpen(false);
                                openEditDialog(selectedUser!);
                            }}
                        >
                            Chỉnh sửa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
