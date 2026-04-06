"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    UtensilsCrossed,
    CalendarCheck,
    ClipboardList,
    Users,
    CreditCard,
    LogOut,
    Moon,
    Sun,
    ChefHat,
    Package,
    Flame,
    Scale,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { logout, getUser } from "@/lib/auth";

const menuItems = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Quản lý bàn",
        url: "/tables",
        icon: UtensilsCrossed,
    },
    {
        title: "Đơn đặt bàn",
        url: "/reservations",
        icon: CalendarCheck,
    },
    {
        title: "Quản lý món ăn",
        url: "/menu",
        icon: ChefHat,
    },
    {
        title: "Đơn hàng",
        url: "/orders",
        icon: ClipboardList,
    },
    {
        title: "Nhân viên",
        url: "/staff",
        icon: Users,
    },
    {
        title: "Thu ngân",
        url: "/cashier",
        icon: CreditCard,
    },
    {
        title: "Bếp",
        url: "/kitchen",
        icon: Flame,
    },
    {
        title: "Kho",
        url: "/inventory",
        icon: Package,
    },
    {
        title: "Định lượng",
        url: "/portioning",
        icon: Scale,
    },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isDark, setIsDark] = useState(false);
    const [user, setUser] = useState<{ fullName?: string; username?: string } | null>(null);

    useEffect(() => {
        const userData = getUser();
        if (!userData) {
            router.push("/login");
            return;
        }
        setUser(userData);

        // Check for dark mode preference
        const isDarkMode = document.documentElement.classList.contains("dark");
        setIsDark(isDarkMode);
    }, [router]);

    const toggleDarkMode = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle("dark");
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="border-b border-sidebar-border">
                    <div className="flex items-center gap-2 px-2 py-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <ChefHat className="size-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Restaurant Admin</span>
                            <span className="text-xs text-muted-foreground">Quản lý nhà hàng</span>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Menu</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {menuItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.url}
                                            tooltip={item.title}
                                        >
                                            <Link href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter className="border-t border-sidebar-border">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={toggleDarkMode}>
                                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleLogout}>
                                <LogOut className="size-4" />
                                <span>Đăng xuất</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex flex-1 items-center justify-between">
                        <h1 className="text-lg font-semibold">
                            {menuItems.find((item) => item.url === pathname)?.title || "Dashboard"}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Xin chào, <span className="font-medium text-foreground">{user?.fullName || user?.username}</span>
                            </span>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
