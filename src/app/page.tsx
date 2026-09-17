import Link from "next/link";
import { ArrowRight, Check, Images, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Brand";

export default function Home() {
  return (
    <main className="simple-home">
      <header className="simple-header">
        <Logo />
        <nav className="public-nav"><a href="#campaigns">Campaigns</a><a href="#how-it-works">How it works</a><Link href="/privacy">Privacy</Link></nav>
      </header>
      <section className="simple-hero">
        <div className="simple-hero-copy">
          <span className="simple-pill">Visual campaigns, made simple</span>
          <h1>Make every milestone <span>worth sharing.</span></h1>
          <p>Open a campaign, add your photo, and share your personalised frame in seconds.</p>
          <div className="simple-actions">
            <Link className="button" href="/uoj-convocation-2026">Open graduation campaign <ArrowRight size={18} /></Link>
          </div>
          <div className="simple-trust"><ShieldCheck size={18} /> Free · 3 frame styles · Photos stay on your device</div>
        </div>
        <div className="simple-demo-card" aria-label="Framezi example">
          <div className="simple-demo-photo">
            <img src="/sample-sri-lankan-graduate.png" alt="Sri Lankan woman graduate in the campaign frame" />
            <img src="/frames/uoj-41st-convocation.png" alt="" />
          </div>
          <div className="simple-demo-label"><Check size={17} /> 41st General Convocation · 3 frames</div>
        </div>
      </section>
      <section className="home-featured" id="campaigns">
        <div className="home-featured-heading">
          <div><span>FEATURED IN SRI LANKA</span><h2>Campaigns people can join</h2><p>Open a campaign, add your photo, and share the moment.</p></div>
        </div>
        <Link href="/uoj-convocation-2026" className="home-campaign-card">
          <div className="home-campaign-art">
            <img src="/sample-sri-lankan-graduate.png" alt="Sri Lankan graduate" />
            <img src="/frames/uoj-41st-convocation.png" alt="University of Jaffna graduation frame" />
          </div>
          <div className="home-campaign-copy">
            <h3>41st General Convocation 2026</h3>
            <p>University of Jaffna</p>
            <span><Images size={15} /> 3 frames available</span>
          </div>
          <ArrowRight size={20} />
        </Link>
      </section>
      <section className="simple-how" id="how-it-works">
        <div className="simple-section-title"><span>HOW IT WORKS</span><h2>One link. Three easy steps.</h2></div>
        <div className="simple-step-grid">
          <article><span>1</span><strong>Open a campaign</strong></article>
          <article><span>2</span><strong>Upload your photo</strong></article>
          <article><span>3</span><strong>Download your frame</strong></article>
        </div>
      </section>
      <footer className="simple-footer">
        <div className="simple-footer-brand"><Logo /><p>Visual campaigns made simple, private, and easy to share.</p><span>Framezi — an <a href="https://infonits.com" target="_blank" rel="noreferrer">Infonits</a> product</span><small>© 2026 Infonits. All rights reserved.</small></div>
        <div className="simple-footer-links"><Link href="/uoj-convocation-2026">Campaign</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </footer>
    </main>
  );
}
