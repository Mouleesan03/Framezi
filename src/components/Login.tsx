"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Logo, PrivacyBadge } from "./Brand";
export default function Login({ configured }: { configured: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (e) {
      setError((e as Error).message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-brand">
        <Logo />
        <h1>
          Bring people
          <br />
          together.
          <br />
          <span style={{ color: "#155eef" }}>Frame the moment.</span>
        </h1>
        <p>
          A little creativity. A shared celebration. Your campaign starts here.
        </p>
        <PrivacyBadge />
        <small>© 2026 Infonits. All rights reserved.</small>
      </section>
      <main className="login-form">
        <Logo />
        <h2>Welcome back.</h2>
        <p>Sign in to your Framezi administrator account.</p>
        {!configured && (
          <div className="notice">
            Administrator sign-in needs Supabase setup. Add the environment
            variables and run the included migration to connect your workspace.
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={submit}>
          <label className="field">
            Email address
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              placeholder="you@organization.com"
            />
          </label>
          <label className="field">
            Password
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </label>
          <button className="button full" disabled={busy || !configured}>
            {busy ? "Signing in…" : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="muted" style={{ marginTop: 22 }}>
          Accounts are created by your administrator. Public registration is not
          available.
        </p>
        <Link
          className="text-link"
          href="/uoj-convocation-2026"
          style={{ marginTop: 24 }}
        >
          Explore the public demo <ArrowRight size={16} />
        </Link>
      </main>
    </div>
  );
}
