import { AdminLayout } from "@/components/admin-layout";

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
