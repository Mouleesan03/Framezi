import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/server";
import AdminShell from "@/components/AdminShell";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await adminClient())) redirect("/admin");
  return <AdminShell>{children}</AdminShell>;
}
