import { AdminLayout } from "@/components/admin-layout";

export default function ReservationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
