"use client";

import { Check, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function CampaignShareLink({ path, title, caption }: { path: string; title: string; caption: string }) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);

  useEffect(() => setUrl(`${window.location.origin}${path}`), [path]);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: caption, url });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(`${caption}\n${url}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="campaign-short-link">
      <span>{url.replace(/^https?:\/\//, "")}</span>
      <button onClick={share} aria-label="Share campaign link">
        {copied ? <Check size={17} /> : <Share2 size={17} />}
      </button>
    </div>
  );
}
