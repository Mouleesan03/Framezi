import Link from "next/link";
import { Logo, Footer } from "@/components/Brand";
export default function NotFound() {
  return (
    <>
      <header className="site-header">
        <Logo />
      </header>
      <main
        className="legal"
        style={{ textAlign: "center", paddingBlock: 110 }}
      >
        <span className="eyebrow" style={{ justifyContent: "center" }}>
          404 · MOMENT NOT FOUND
        </span>
        <h1 style={{ marginTop: 20 }}>This frame is out of view.</h1>
        <p>
          The campaign may be unpublished, archived, or the link may be
          incorrect.
        </p>
        <Link href="/" className="button" style={{ marginTop: 25 }}>
          Back to Framezi
        </Link>
      </main>
      <Footer />
    </>
  );
}
