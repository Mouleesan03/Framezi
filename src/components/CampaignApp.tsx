"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ShieldCheck,
  Upload,
  RotateCw,
  RefreshCw,
  Move,
  Check,
  ArrowRight,
  Download,
  Share2,
  Image as ImageIcon,
  X,
} from "lucide-react";
import type { Campaign } from "@/lib/types";
import { PrivacyBadge } from "./Brand";
import {
  loadImageFromFile,
  loadImage,
  renderFrame,
  exportPNG,
  exportJPG,
  createShareFile,
  saveBlob,
  safeFilename,
  type CropArea,
} from "@/lib/canvas";
const PhotoCropper = dynamic(() => import("./PhotoCropper"), { ssr: false });
export default function CampaignApp({
  campaign: c,
  demo = false,
}: {
  campaign: Campaign;
  demo?: boolean;
}) {
  const frames = c.frames
    .filter((f) => f.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const needsDetails = c.require_name || c.require_email;
  const initialStep = needsDetails ? 1 : 2;
  const [step, setStep] = useState(initialStep);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(!needsDetails);
  const [marketing, setMarketing] = useState(false);
  const [participant, setParticipant] = useState("");
  const [photo, setPhoto] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<CropArea | null>(null);
  const [selected, setSelected] = useState(frames[0]?.id || "");
  const size = 2160;
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);
  const [analyticsOffline, setAnalyticsOffline] = useState(false);
  const [proof, setProof] = useState("");
  const imageRef = useRef<HTMLImageElement | null>(null);
  const frameImages = useRef(new Map<string, HTMLImageElement>());
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const blob = useRef<Blob | null>(null);
  const generation = useRef("");
  const counted = useRef(new Set<string>());
  const previewRef = useRef<HTMLDivElement>(null);
  const eventQueue = useRef(Promise.resolve());
  const viewed = useRef(false);
  const active = frames.find((f) => f.id === selected);
  const placeholderPhoto = {
    "uoj-convocation-2026": "/sample-sri-lankan-graduate.png",
    "world-animal-day-2026": "/sample-animal-advocate.png",
    "world-teachers-day-2026": "/sample-teacher.png",
    "world-mental-health-day-2026": "/sample-mental-health-supporter.png",
  }[c.slug] || "/sample-sri-lankan-graduate.png";
  const notify = (message: string) => {
    setToast(message);
  };
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  const event = useCallback(
    (type: string, frameId?: string, generationId?: string) => {
      if (demo) return;
      eventQueue.current = eventQueue.current.then(async () => {
        try {
          const response = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              campaign_id: c.id,
              ...(participant ? { submission_id: participant } : {}),
              event_type: type,
              ...(frameId ? { frame_id: frameId } : {}),
              ...(generationId ? { generation_id: generationId } : {}),
            }),
          });
          if (!response.ok) setAnalyticsOffline(true);
        } catch {
          setAnalyticsOffline(true);
        }
      });
    },
    [c.id, demo, participant],
  );
  useEffect(() => {
    if (!viewed.current) {
      viewed.current = true;
      event("campaign_view");
    }
  }, [event]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      frames.map(async (f) => {
        const image = await loadImage(f.frame_url);
        if (!cancelled) frameImages.current.set(f.id, image);
      }),
    )
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "A campaign frame could not be loaded. Reconnect and reload before editing.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [c.id]); // Campaign assets only, never visitor images.
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo);
    },
    [photo],
  );
  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result);
    },
    [result],
  );
  useEffect(
    () => () => {
      if (proof) URL.revokeObjectURL(proof);
    },
    [proof],
  );
  useEffect(() => {
    if (step !== 3 || !area || !imageRef.current || !active) return;
    let alive = true;
    const frame = frameImages.current.get(active.id);
    if (!frame) return;
    const temp = renderFrame(
      imageRef.current,
      frame,
      area,
      rotation,
      c,
      name,
      size,
    );
    exportPNG(temp).then((b) => {
      if (alive) setProof(URL.createObjectURL(b));
      temp.width = temp.height = 0;
    });
    return () => {
      alive = false;
    };
  }, [step, area, selected, rotation, name, c, size]);
  async function createParticipant() {
    if (participant) return participant;
    if (demo) {
      const id = crypto.randomUUID();
      setParticipant(id);
      return id;
    }
    const r = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaign_id: c.id,
            name,
            email,
            consent,
            marketing_consent: marketing,
          }),
        });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Unable to continue.");
    setParticipant(data.id);
    return data.id as string;
  }
  async function register(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setError("");
    setBusy(true);
    try {
      await createParticipant();
      setStep(2);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function choosePhoto(file?: File) {
    if (!file || !consent) return;
    setError("");
    setBusy(true);
    try {
      const alreadyRegistered = Boolean(participant);
      await createParticipant();
      const url = await loadImageFromFile(file);
      const image = await loadImage(url);
      imageRef.current = image;
      setPhoto(url);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setArea(null);
      setStep(2);
      if (alreadyRegistered) event("photo_selected");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function generate() {
    if (!imageRef.current || !area || !active) return;
    const frame = frameImages.current.get(active.id);
    if (!frame) return;
    setError("");
    setBusy(true);
    try {
      await new Promise((r) => requestAnimationFrame(r));
      if (canvas.current) canvas.current.width = 0;
      canvas.current = renderFrame(
        imageRef.current,
        frame,
        area,
        rotation,
        c,
        name,
        size,
      );
      blob.current = await exportPNG(canvas.current);
      setResult(URL.createObjectURL(blob.current));
      generation.current = crypto.randomUUID();
      counted.current.clear();
      event("generated", selected, generation.current);
      setStep(4);
    } catch {
      setError(
        "We could not create your frame. Try a smaller photo or a different frame.",
      );
    } finally {
      setBusy(false);
    }
  }
  const filename = (ext: string) =>
    `${safeFilename(c.filename_prefix || "Framezi")}-${c.slug}-${safeFilename(name)}.${ext}`;
  async function download(format: "png" | "jpg") {
    if (!canvas.current || !blob.current) return;
    try {
      saveBlob(
        format === "png" ? blob.current : await exportJPG(canvas.current),
        filename(format),
      );
      if (!counted.current.has(format)) {
        counted.current.add(format);
        event(`download_${format}`, selected, generation.current);
      }
      notify(c.thank_you_text || "Your download is ready.");
    } catch {
      setError("Download unavailable. Please try again.");
    }
  }
  async function share() {
    if (!blob.current) return;
    try {
      const file = createShareFile(blob.current, filename("png"));
      const url = window.location.origin + "/" + c.slug;
      if (navigator.share) {
        if (navigator.canShare?.({ files: [file] }))
          await navigator.share({ files: [file], text: c.share_text });
        else await navigator.share({ url, text: c.share_text });
        if (!counted.current.has("share")) {
          event("share", selected, generation.current);
          counted.current.add("share");
        }
      } else {
        await navigator.clipboard.writeText(url);
        notify("Sharing is unavailable here. Campaign link copied!");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setError(
          "Sharing could not be opened. Download your frame or copy the campaign link.",
        );
    }
  }
  function reset() {
    setStep(initialStep);
    setName("");
    setEmail("");
    setConsent(!needsDetails);
    setMarketing(false);
    setParticipant("");
    setPhoto("");
    setResult("");
    setProof("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setArea(null);
    setSelected(frames[0]?.id || "");
    setError("");
    imageRef.current = null;
    blob.current = null;
    if (canvas.current) canvas.current.width = canvas.current.height = 0;
    canvas.current = null;
    counted.current.clear();
  }
  if (!frames.length)
    return (
      <div className="panel empty">
        Frames are not available yet. Please check back soon.
      </div>
    );
  return (
    <div className={`generator ${photo && step === 2 ? "photo-editor" : ""} ${step === 4 ? "result-editor" : ""}`}>
      {demo && (
        <div className="notice">
          Free to use · No watermark · No email required
        </div>
      )}
      <div className="progress-steps" aria-label="Your progress">
        {[
          ...(needsDetails ? [{ label: "Info", value: 1 }] : []),
          { label: "Photo", value: 2 },
          ...(frames.length > 1 ? [{ label: "Frame", value: 3 }] : []),
          { label: "Done", value: 4 },
        ].map(({ label, value }, i) => (
          <div
            key={label}
            className={`progress-step ${step >= value ? "active" : ""}`}
            aria-current={step === value ? "step" : undefined}
          >
            <span>{step > value ? <Check size={13} /> : i + 1}</span>
            {label}
          </div>
        ))}
      </div>
      {photo && (step === 2 || step === 4) && (
        <div className="mobile-editor-header">
          <strong>{step === 4 ? "Your graduation frame" : c.name}</strong>
          <button aria-label="Close editor" onClick={reset}><X size={24} /></button>
        </div>
      )}
      {photo && step === 2 && (
        <div className="editor-gesture-hint">
          <Move size={16} aria-hidden="true" />
          <span>Drag to move · Pinch with two fingers to zoom</span>
        </div>
      )}
      <div className="generator-layout editing">
        <div className="panel">
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          {step === 1 && (
            <>
              <h2>Your details</h2>
              <p className="muted" style={{ marginBottom: 22 }}>
                Enter the details requested by this campaign.
              </p>
              <form onSubmit={register}>
                {c.require_name && <label className="field">
                  Your Name {c.require_name ? "*" : "(optional)"}
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                    required={c.require_name}
                    placeholder="Enter your name"
                    autoComplete="name"
                  />
                </label>}
                {c.require_email && <label className="field">
                  Email Address {c.require_email ? "*" : "(optional)"}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={150}
                    required={c.require_email}
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </label>}
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                  />
                  <span>
                    I agree to the campaign privacy policy. My photo stays on
                    this device.{" "}
                    <Link href="/privacy" target="_blank">
                      Read more
                    </Link>
                  </span>
                </label>
                <button
                  className="button full"
                  disabled={busy || !consent || !ready}
                >
                  {busy
                    ? "Continuing…"
                    : !ready
                      ? "Loading campaign frames…"
                      : "Continue"}
                  <ArrowRight size={17} />
                </button>
              </form>
            </>
          )}
          {step === 2 && (
            <>
              <h2>{photo ? "Make it fit" : "Choose your photo"}</h2>
              <p className="muted" style={{ marginBottom: 20 }}>
                {photo
                  ? "Drag to move. Pinch with two fingers to zoom."
                  : "Pick a clear portrait from your phone."}
              </p>
              {!photo && (
                <label
                  className="upload-zone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void choosePhoto(e.dataTransfer.files[0]);
                  }}
                >
                  <Upload size={27} />
                  <strong>Choose photo</strong>
                  <small>JPG, PNG or WEBP · up to 15 MB</small>
                  <input
                    type="file"
                    disabled={busy}
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    onChange={(e) => {
                      void choosePhoto(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                    aria-label="Upload Your Photo"
                  />
                </label>
              )}
              {!photo && (
                <p className="upload-privacy-note">
                  By choosing a photo, you agree to the <Link href="/privacy" target="_blank">privacy policy</Link>. Your photo stays on your device.
                </p>
              )}
              {photo && (
                <>
                  {frames.length > 1 && (
                    <div className="editor-frame-picker" aria-label="Choose a frame">
                      <span>Choose a frame</span>
                      <div>
                        {frames.map((frame) => (
                          <button
                            key={frame.id}
                            className={selected === frame.id ? "selected" : ""}
                            aria-label={frame.name}
                            aria-pressed={selected === frame.id}
                            onClick={() => {
                              setSelected(frame.id);
                              event("frame_selected", frame.id);
                            }}
                          >
                            <img src={frame.thumbnail_url || frame.frame_url} alt="" />
                            {selected === frame.id && <Check size={15} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="editor-bottom-controls" aria-label="Photo controls">
                    <label>
                      <Upload size={20} />
                      <span>Photo</span>
                      <input
                        type="file"
                        disabled={busy}
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        onChange={(e) => {
                          void choosePhoto(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                        aria-label="Change photo"
                      />
                    </label>
                    <button
                      type="button"
                      aria-label="Rotate photo"
                      onClick={() => setRotation((value) => (value + 90) % 360)}
                    >
                      <RotateCw size={20} />
                      <span>Rotate</span>
                    </button>
                    <button
                      type="button"
                      aria-label="Reset photo position"
                      onClick={() => {
                        setCrop({ x: 0, y: 0 });
                        setZoom(1);
                        setRotation(0);
                      }}
                    >
                      <RefreshCw size={20} />
                      <span>Reset</span>
                    </button>
                  </div>
                  <button
                    className="button full editor-create-button"
                    disabled={busy || !area}
                    onClick={() => void generate()}
                  >
                    Create my frame <ArrowRight size={17} />
                  </button>
                </>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <h2>Choose a frame</h2>
              <div className="frame-options">
                {frames.map((f) => (
                  <button
                    key={f.id}
                    className={`frame-option ${selected === f.id ? "selected" : ""}`}
                    aria-pressed={selected === f.id}
                    onClick={() => {
                      setSelected(f.id);
                      event("frame_selected", f.id);
                    }}
                  >
                    <img src={f.thumbnail_url || f.frame_url} alt={f.name} />
                    {selected === f.id && <Check size={19} />}
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
              <button
                className="button full"
                onClick={generate}
                disabled={busy || !ready}
              >
                {busy
                  ? "Creating your frame…"
                  : c.cta_text || "Generate My Frame"}
                <ImageIcon size={17} />
              </button>
              <button
                className="button secondary full"
                style={{ marginTop: 10 }}
                onClick={() => setStep(2)}
              >
                Adjust my photo
              </button>
            </>
          )}
          {step === 4 && (
            <>
              <span className="badge published">
                <Check size={14} /> Made on your device
              </span>
              <h2 style={{ marginTop: 17 }}>Your frame is ready</h2>
              <p className="muted" style={{ marginBottom: 22 }}>
                {c.thank_you_text || "Your moment, beautifully framed."}
              </p>
              <div className="result-actions">
                {c.enable_png && (
                  <button className="button" onClick={() => download("png")}>
                    <Download size={16} /> Download frame
                  </button>
                )}
                {c.enable_share && (
                  <button className="button secondary" onClick={share}>
                    <Share2 size={16} /> Share
                  </button>
                )}
              </div>
              <button
                className="button secondary full"
                style={{ marginTop: 20 }}
                onClick={reset}
              >
                Create Another Frame
              </button>
            </>
          )}
          <div className="compact-privacy">
            <PrivacyBadge />
          </div>
          {c.privacy_text &&
            c.privacy_text !==
              "Your photo stays on your device. It is processed only in your browser and is never uploaded or stored on Framezi servers." && (
              <p className="offline-note">{c.privacy_text}</p>
            )}
          {analyticsOffline && (
            <p className="offline-note">
              Activity could not be recorded. Your photo editor and downloads
              still work on your device.
            </p>
          )}
        </div>
        <div className="editor-preview">
          <div className="preview-square" ref={previewRef}>
            {step === 4 && result ? (
              <img src={result} alt="Your generated frame" />
            ) : step === 3 && proof ? (
              <img src={proof} alt="Your frame preview" />
            ) : (
              <>
                {photo ? (
                  <PhotoCropper
                    image={photo}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onComplete={setArea}
                  />
                ) : (
                  <img
                    src={placeholderPhoto}
                    alt={`Example participant showing the ${c.name} frame`}
                  />
                )}
                {active && (
                  <img
                    className="frame-overlay"
                    src={active.frame_url}
                    alt=""
                  />
                )}
                {c.show_name_on_image && (
                  <span
                    className={`preview-name ${c.name_position}`}
                    style={{
                      color: c.name_color,
                      fontFamily: c.name_font,
                      fontSize: `${Math.min((c.name_font_size / 2160) * 380, (310 / Math.max(name.length, 10)) * 1.65)}px`,
                    }}
                  >
                    {name || "Your name here"}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="preview-label">
            <span>
              {photo ? <ShieldCheck size={14} /> : <Check size={14} />}
              {photo ? "Private preview" : active?.name}
            </span>
            <span>
              {photo ? `${size} × ${size}` : `${frames.length} ${frames.length === 1 ? "frame" : "frames"}`}
            </span>
          </div>
        </div>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
