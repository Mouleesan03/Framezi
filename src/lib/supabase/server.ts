import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
export const configured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
export async function serverClient() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server Component: proxy refreshes cookies. */
          }
        },
      },
    },
  );
}
export function serviceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Server configuration is incomplete");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function adminClient() {
  if (!configured()) return null;
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role === "admin" ? client : null;
}
