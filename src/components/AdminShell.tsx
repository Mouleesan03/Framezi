"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Users,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { Logo } from "./Brand";
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();
  return (
    <div className="admin-layout">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Logo />
          {open && (
            <button
              className="icon-button"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          )}
        </div>
        <nav>
          {[
            [LayoutDashboard, "Dashboard", "dashboard"],
            [Layers, "Campaigns", "campaigns"],
            [Users, "Submissions", "submissions"],
            [ChartNoAxesCombined, "Analytics", "analytics"],
            [Settings, "Settings", "settings"],
          ].map(([Icon, label, route]) => {
            const I = Icon as typeof Layers;
            return (
              <Link
                onClick={() => setOpen(false)}
                className={path.startsWith("/admin/" + route) ? "active" : ""}
                href={"/admin/" + route}
                key={String(route)}
              >
                <I size={19} />
                {String(label)}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="logout"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.replace("/admin");
              router.refresh();
            }}
          >
            <LogOut size={18} /> Log out
          </button>
          <small>Framezi · An Infonits product</small>
        </div>
      </aside>
      <div className="admin-content">
        <div className="admin-topbar">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              className="icon-button admin-mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={19} />
            </button>
            <span>Your celebration workspace</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/" target="_blank">
              Visit site{" "}
              <ArrowUpRight size={13} style={{ display: "inline" }} />
            </Link>
            <span className="avatar">A</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
