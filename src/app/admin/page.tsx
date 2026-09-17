import Login from "@/components/Login";
import { configured, adminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (await adminClient()) redirect("/admin/dashboard");
  return <Login configured={configured()} />;
}
