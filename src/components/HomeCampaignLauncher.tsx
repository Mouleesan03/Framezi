"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ImagePlus, Plus, X } from "lucide-react";

export default function HomeCampaignLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button className="button" type="button" onClick={() => setOpen(true)}>
        <Plus size={18} /> Start a campaign
      </button>

      {open && (
        <div
          className="campaign-launcher-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="campaign-launcher"
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-launcher-title"
          >
            <button
              autoFocus
              className="campaign-launcher-close"
              type="button"
              aria-label="Close campaign options"
              onClick={() => setOpen(false)}
            >
              <X size={24} />
            </button>
            <div className="campaign-launcher-heading">
              <span>Create on Framezi</span>
              <h2 id="campaign-launcher-title">What do you want to create?</h2>
              <p>
                Start with a photo frame your community can personalise and
                share.
              </p>
            </div>
            <Link className="campaign-type-card" href="/create">
              <span className="campaign-type-icon">
                <ImagePlus size={34} />
              </span>
              <div>
                <h3>Photo frame campaign</h3>
                <p>
                  Upload one or more transparent frames and share one campaign
                  link.
                </p>
              </div>
              <div className="campaign-type-examples" aria-hidden="true">
                <img src="/frames/uoj-41st-convocation.png" alt="" />
                <img src="/frames/world-animal-day-2026.png" alt="" />
                <img src="/frames/world-mental-health-day-2026.png" alt="" />
              </div>
              <strong>
                Start with a frame <ArrowRight size={17} />
              </strong>
            </Link>
          </section>
        </div>
      )}
    </>
  );
}
