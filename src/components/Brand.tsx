import Link from "next/link";
import { Scan, ShieldCheck, ArrowUpRight } from "lucide-react";
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
    <footer>
      <div>
        <Logo />
        <p>{BRAND.tagline}</p>
        <small>
          {BRAND.name} — an {BRAND.company} product
        </small>
      </div>
      <div className="footer-links">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href="https://infonits.com" target="_blank" rel="noreferrer">
          Infonits <ArrowUpRight size={14} />
        </a>
        <small>
          © {BRAND.year} {BRAND.company}. All rights reserved.
        </small>
      </div>
    </footer>
  );
}
