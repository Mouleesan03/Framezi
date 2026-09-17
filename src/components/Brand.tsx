import Link from "next/link";
import { Scan, ShieldCheck } from "lucide-react";
import { BRAND, PRIVACY } from "@/config/brand";
export function Logo() {
  return (
    <Link href="/" className="logo">
      <span className="logo-mark">
        <Scan size={23} />
      </span>
      {BRAND.name.toLowerCase()}
      <span className="logo-dot">.</span>
    </Link>
  );
}
export function PrivacyBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`privacy-badge ${compact ? "compact" : ""}`}>
      <ShieldCheck size={21} />
      <span>{compact ? "Your photos stay yours. Always." : PRIVACY}</span>
    </div>
  );
}
export function Footer() {
  return (
    <footer className="public-footer">
      <div className="public-footer-main">
        <div className="public-footer-brand">
          <Logo />
          <p>Simple, private visual campaigns for moments and causes worth sharing.</p>
        </div>
        <div className="public-footer-column">
          <strong>Campaigns</strong>
          <Link href="/uoj-convocation-2026">Jaffna Convocation</Link>
          <Link href="/world-animal-day-2026">World Animal Day</Link>
          <Link href="/world-teachers-day-2026">World Teachers’ Day</Link>
          <Link href="/world-mental-health-day-2026">Mental Health Day</Link>
        </div>
        <div className="public-footer-column">
          <strong>Framezi</strong>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <div className="public-footer-column">
          <strong>Company</strong>
          <a href="https://infonits.io" target="_blank" rel="noreferrer">Infonits</a>
        </div>
      </div>
      <div className="public-footer-bottom">
        <span>© {BRAND.year} <a href="https://infonits.io" target="_blank" rel="noreferrer">{BRAND.company}</a>. All rights reserved.</span>
        <span>Made in Sri Lanka</span>
      </div>
    </footer>
  );
}
