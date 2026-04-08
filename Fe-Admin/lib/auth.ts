export interface User {
  id: number;
  username: string;
  roleId: number;
  roleName: string;
  fullName: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

// Roles allowed to access the admin panel (CUSTOMER and STAFF are excluded)
export const ALLOWED_ADMIN_ROLES = ["ADMIN", "MANAGER", "CASHIER", "KITCHEN"] as const;

// Page paths each role can access.
const ROLE_PAGE_ACCESS: Record<string, string[]> = {
  ADMIN:   ["/dashboard", "/tables", "/reservations", "/menu", "/orders", "/staff", "/payments", "/kitchen", "/inventory", "/portioning", "/floor-plan"],
  MANAGER: ["/dashboard", "/tables", "/reservations", "/menu", "/orders", "/payments", "/kitchen", "/inventory", "/portioning", "/floor-plan"],
  CASHIER: ["/dashboard", "/orders", "/tables", "/payments", "/reservations"],
  KITCHEN: ["/kitchen", "/inventory", "/portioning"],
};

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function isAdminUser(): boolean {
  const user = getUser();
  if (!user) return false;
  return ALLOWED_ADMIN_ROLES.some(
    (r) => r.toLowerCase() === user.roleName?.toLowerCase()
  );
}

/** Returns true if the given role is allowed to visit the given Next.js pathname. */
export function canAccessPath(roleName: string | undefined | null, path: string): boolean {
  if (!roleName) return false;
  const role = roleName.toUpperCase();
  const allowed = ROLE_PAGE_ACCESS[role] ?? [];
  return allowed.some((p) => path === p || path.startsWith(p + "/"));
}

/** Returns the first page the user should land on after login. */
export function getDefaultPath(roleName: string | undefined | null): string {
  if (!roleName) return "/login";
  const role = roleName.toUpperCase();
  if (role === "KITCHEN") return "/kitchen";
  if (role === "CASHIER") return "/dashboard";
  return "/dashboard";
}

export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}
