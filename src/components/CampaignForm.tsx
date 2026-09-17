"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Save, Trash2, Upload } from "lucide-react";
import type { Campaign, Frame } from "@/lib/types";
import { campaignSchema } from "@/lib/validation";
import { MAX_FRAMES } from "@/config/brand";

const steps = ["Details", "Frames", "Options"];

export default function CampaignForm({ initial }: { initial: Campaign }) {
  const [c, setC] = useState(initial);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function set<K extends keyof Campaign>(key: K, value: Campaign[K]) {
    setC((current) => ({ ...current, [key]: value }));
  }

  function text(key: keyof Campaign, label: string, multiline = false) {
    return <label className="field">{label}
      {multiline ? <textarea value={String(c[key] ?? "")} onChange={(e) => set(key, e.target.value as never)} /> :
        <input value={String(c[key] ?? "")} onChange={(e) => {
          set(key, e.target.value as never);
          if (key === "name" && !initial.id) setC((current) => ({ ...current, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }));
        }} />}
    </label>;
  }

  function toggle(key: keyof Campaign, label: string) {
    return <label className="check-field"><input type="checkbox" checked={Boolean(c[key])} onChange={(e) => set(key, e.target.checked as never)} /><span>{label}</span></label>;
  }

  async function upload(file: File | undefined, kind: "frame" | "brand") {
    if (!file) return "";
    if (file.size > 4 * 1024 * 1024) throw new Error("Image must be smaller than 4 MB.");
    if (kind === "frame") {
      if (file.type !== "image/png") throw new Error("Frames must be transparent PNG files.");
      const bitmap = await createImageBitmap(file);
      const square = bitmap.width === bitmap.height;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 64;
      const context = canvas.getContext("2d")!;
      context.drawImage(bitmap, 0, 0, 64, 64);
      bitmap.close();
      if (!square) throw new Error("Frame must be square. Use 2160 × 2160 pixels.");
      const pixels = context.getImageData(0, 0, 64, 64).data;
      let transparent = false;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] < 250) { transparent = true; break; }
      if (!transparent) throw new Error("Frame PNG needs a transparent area for the photo.");
    }
    const response = await fetch(`/api/admin/assets?kind=${kind}`, { method: "POST", headers: { "Content-Type": file.type }, body: file });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Upload failed.");
    return data.url as string;
  }

  async function addFrame(file?: File) {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const url = await upload(file, "frame");
      const frame: Frame = { id: crypto.randomUUID(), name: file.name.replace(/\.png$/i, "") || `Frame ${c.frames.length + 1}`, frame_url: url, thumbnail_url: url, sort_order: c.frames.length, is_active: true };
      set("frames", [...c.frames, frame]);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function addLogo(file?: File) {
    if (!file) return;
    setBusy(true); setError("");
    try { set("logo_url", await upload(file, "brand")); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function save(publish = false) {
    setError("");
    const next = { ...c, status: publish ? "published" as const : c.status };
    const parsed = campaignSchema.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join(" · "));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save campaign.");
      router.push(`/admin/campaigns/${data.id}`);
      router.refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return <main className="page-shell simple-campaign-editor">
    <div className="page-heading">
      <div><h1>{initial.id ? "Edit campaign" : "New campaign"}</h1><p>Set it up, upload frames, and publish.</p></div>
      <button className="button secondary" disabled={busy} onClick={() => save()}><Save size={17} /> Save</button>
    </div>

    <div className="editor-tabs simple-tabs">
      {steps.map((label, index) => <button className={step === index ? "active" : ""} key={label} onClick={() => setStep(index)}>{index + 1}. {label}</button>)}
    </div>
    {error && <div className="error" role="alert">{error}</div>}

    <section className="panel simple-editor-panel">
      {step === 0 && <>
        <h2>Campaign details</h2>
        {text("name", "Campaign name")}
        <label className="field">Public link<input value={c.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} /><small>framezi.com/{c.slug || "your-event"}</small></label>
        {text("organization_name", "Organization")}
        {text("title", "Page title")}
        {text("description", "Short description", true)}
        <div className="form-grid">{text("event_date_text", "Date")}{text("location", "Location")}</div>
        <div className="simple-brand-row">
          <label className="field">Brand colour<input type="color" value={c.primary_color} onChange={(e) => set("primary_color", e.target.value)} /></label>
          <label className="field simple-file">Logo (optional)<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(e) => void addLogo(e.target.files?.[0])} /></label>
          {c.logo_url && <img className="simple-logo-preview" src={c.logo_url} alt="Logo preview" />}
        </div>
      </>}

      {step === 1 && <>
        <h2>Campaign frames</h2>
        <p className="muted">Upload square transparent PNG files. 2160 × 2160 pixels works best.</p>
        <div className="simple-frame-list">
          {c.frames.map((frame, index) => <article className="simple-frame-item" key={frame.id}>
            <img src={frame.frame_url} alt={frame.name} />
            <input aria-label="Frame name" value={frame.name} onChange={(e) => set("frames", c.frames.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} />
            <button className="icon-button danger" aria-label={`Remove ${frame.name}`} onClick={() => set("frames", c.frames.filter((_, i) => i !== index))}><Trash2 size={17} /></button>
          </article>)}
        </div>
        {c.frames.length < MAX_FRAMES && <label className="simple-frame-upload"><Upload size={22} /><strong>{busy ? "Uploading…" : "Upload a frame"}</strong><span>Transparent PNG · up to 4 MB</span><input type="file" accept="image/png" disabled={busy} onChange={(e) => { void addFrame(e.target.files?.[0]); e.target.value = ""; }} /></label>}
      </>}

      {step === 2 && <>
        <h2>Simple options</h2>
        {toggle("require_name", "Ask for a name")}
        {toggle("require_email", "Ask for an email address")}
        {toggle("show_name_on_image", "Show the name on the image")}
        {toggle("enable_share", "Show the share button")}
        <label className="field">Campaign status<select value={c.status} onChange={(e) => set("status", e.target.value as Campaign["status"])}><option value="draft">Draft</option><option value="published">Published</option><option value="ended">Ended</option></select></label>
        <div className="simple-summary"><Check size={18} /><span>{c.frames.filter((frame) => frame.is_active).length} frame{c.frames.length === 1 ? "" : "s"} ready</span></div>
      </>}

      <div className="simple-editor-actions">
        <button className="button secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
        {step < 2 ? <button className="button" onClick={() => setStep(step + 1)}>Continue</button> : <button className="button" disabled={busy} onClick={() => save(true)}><Check size={17} /> Publish</button>}
      </div>
    </section>
  </main>;
}
