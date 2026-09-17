import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"),
  title: "Framezi — Create Personalised Event Photo Frames",
  description:
    "Create personalised event and celebration photo frames in seconds with Framezi. Your photographs are processed privately on your device.",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
