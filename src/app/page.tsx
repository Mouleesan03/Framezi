import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Download,
  LockKeyhole,
  Share2,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/Brand";

const campaigns = [
  {
    href: "/uoj-convocation-2026",
    title: "41st General Convocation 2026",
    organization: "University of Jaffna",
    date: "06–08 October 2026",
    frames: "3 frames",
    frame: "/frames/uoj-41st-convocation.png",
    person: "/sample-sri-lankan-graduate.png",
    className: "graduation",
  },
  {
    href: "/world-animal-day-2026",
    title: "World Animal Day 2026",
    organization: "Ministry of Environment",
    date: "October 4, 2026",
    frames: "1 frame",
    frame: "/frames/world-animal-day-2026.png",
    person: "/sample-animal-advocate.png",
    className: "animal-day",
  },
  {
    href: "/world-teachers-day-2026",
    title: "World Teachers’ Day 2026",
    organization: "Global Education Community",
    date: "October 5, 2026",
    frames: "1 frame",
    frame: "/frames/world-teachers-day-2026.png",
    person: "/sample-teacher.png",
    className: "teachers-day",
  },
  {
    href: "/world-mental-health-day-2026",
    title: "World Mental Health Day 2026",
    organization: "Global Wellbeing Community",
    date: "October 10, 2026",
    frames: "1 frame",
    frame: "/frames/world-mental-health-day-2026.png",
    person: "/sample-mental-health-supporter.png",
    className: "mental-health-day",
  },
];

export default function Home() {
  return (
    <main className="simple-home">
      <header className="simple-header">
        <Logo />
        <nav className="public-nav" aria-label="Main navigation">
          <a href="#campaigns">Campaigns</a>
          <a href="#how-it-works">How it works</a>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </header>

      <section className="simple-hero">
        <div className="simple-hero-copy">
          <span className="simple-pill"><Sparkles size={14} /> Free visual campaigns</span>
          <h1>Show up for the moments that <span>matter.</span></h1>
          <p>Choose a campaign, add your photo, and download a share-ready frame in seconds.</p>
          <div className="simple-actions">
            <a className="button" href="#campaigns">Explore campaigns <ArrowRight size={18} /></a>
            <a className="hero-text-link" href="#how-it-works">See how it works</a>
          </div>
          <div className="simple-trust">
            <span><Check size={15} /> Always free</span>
            <span><LockKeyhole size={15} /> Photo stays private</span>
            <span><Download size={15} /> No watermark</span>
          </div>
        </div>
        <div className="home-hero-gallery" aria-label="Framezi campaign examples">
          <div className="simple-demo-card hero-card-main">
            <div className="simple-demo-photo">
              <img src="/sample-animal-advocate.png" alt="Animal advocate using the World Animal Day campaign frame" />
              <img src="/frames/world-animal-day-2026.png" alt="" />
            </div>
            <div className="simple-demo-label"><Check size={17} /> World Animal Day · October 4</div>
          </div>
          <div className="hero-mini-card">
            <div>
              <img src="/sample-sri-lankan-graduate.png" alt="" />
              <img src="/frames/uoj-41st-convocation.png" alt="" />
            </div>
            <span>Graduation 2026</span>
          </div>
        </div>
      </section>

      <section className="home-featured" id="campaigns">
        <div className="home-featured-heading">
          <span>CAMPAIGNS TO JOIN</span>
          <h2>Pick a cause. Make it yours.</h2>
          <p>Personalise a frame and share what you are proud to support.</p>
        </div>
        <div className="home-campaign-grid">
          {campaigns.map((campaign) => (
            <Link href={campaign.href} className="home-campaign-card" key={campaign.href}>
              <div className={`home-campaign-art ${campaign.className}`}>
                <img src={campaign.person} alt="" />
                <img src={campaign.frame} alt={`${campaign.title} frame`} />
                <span>{campaign.frames}</span>
              </div>
              <div className="home-campaign-copy">
                <p>{campaign.organization}</p>
                <h3>{campaign.title}</h3>
                <div><span><CalendarDays size={14} /> {campaign.date}</span><ArrowRight size={18} /></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-trust-section">
        <div className="home-trust-copy">
          <span>MADE FOR EASY PARTICIPATION</span>
          <h2>Your photo stays yours.</h2>
          <p>Framezi edits photos inside your browser. Your image is never uploaded or stored on our servers.</p>
          <Link href="/privacy">Read our privacy promise <ArrowRight size={15} /></Link>
        </div>
        <div className="home-benefit-grid">
          <article><LockKeyhole size={22} /><strong>Private by design</strong><p>Your photo is processed only on your device.</p></article>
          <article><Sparkles size={22} /><strong>Simple to create</strong><p>Move, pinch, choose a frame, and download.</p></article>
          <article><Share2 size={22} /><strong>Ready to share</strong><p>One clean image for your favourite social app.</p></article>
        </div>
      </section>

      <section className="simple-how" id="how-it-works">
        <div className="simple-section-title"><span>HOW IT WORKS</span><h2>From campaign to camera roll.</h2><p>No account, email, or design skills needed.</p></div>
        <div className="simple-step-grid">
          <article><span>1</span><div><strong>Choose a campaign</strong><small>Pick the moment or cause you support.</small></div></article>
          <article><span>2</span><div><strong>Add your photo</strong><small>Drag and pinch until it looks right.</small></div></article>
          <article><span>3</span><div><strong>Download and share</strong><small>Save the finished frame to your device.</small></div></article>
        </div>
      </section>

      <footer className="simple-footer">
        <div className="simple-footer-main">
          <div className="simple-footer-brand">
            <Logo />
            <p>Simple, private visual campaigns for moments and causes worth sharing.</p>
          </div>
          <div className="simple-footer-column">
            <strong>Campaigns</strong>
            <Link href="/uoj-convocation-2026">Jaffna Convocation</Link>
            <Link href="/world-animal-day-2026">World Animal Day</Link>
            <Link href="/world-teachers-day-2026">World Teachers’ Day</Link>
            <Link href="/world-mental-health-day-2026">Mental Health Day</Link>
          </div>
          <div className="simple-footer-column">
            <strong>Framezi</strong>
            <a href="#how-it-works">How it works</a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
          <div className="simple-footer-column">
            <strong>Company</strong>
            <a href="https://infonits.io" target="_blank" rel="noreferrer">Infonits</a>
          </div>
        </div>
        <div className="simple-footer-bottom"><span>© 2026 <a href="https://infonits.io" target="_blank" rel="noreferrer">Infonits</a>. All rights reserved.</span><span>Made in Sri Lanka</span></div>
      </footer>
    </main>
  );
}
