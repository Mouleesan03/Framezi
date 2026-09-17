"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  List,
  LockKeyhole,
  Upload,
  X,
} from "lucide-react";
import { emptyCampaign } from "@/lib/demo";

const thumbnails = [
  "/sample-sri-lankan-graduate.png",
  "/sample-animal-advocate.png",
  "/sample-teacher.png",
];

export default function CampaignCreator() {
  const [step, setStep] = useState(0);
  const [frame, setFrame] = useState<File | null>(null);
  const [frameUrl, setFrameUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [thumbnail, setThumbnail] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");

  const canContinue = useMemo(
    () =>
      step === 0
        ? Boolean(frame)
        : step === 1
          ? Boolean(title.trim() && slug)
          : true,
    [frame, slug, step, title],
  );

  useEffect(
    () => () => {
      if (frameUrl) URL.revokeObjectURL(frameUrl);
    },
    [frameUrl],
  );

  async function chooseFrame(file?: File) {
    if (!file) return;
    setError("");
    if (file.type !== "image/png")
      return setError("Upload a transparent PNG frame.");
    if (file.size > 4 * 1024 * 1024)
      return setError("Frame must be smaller than 4 MB.");
    const bitmap = await createImageBitmap(file);
    if (bitmap.width !== bitmap.height) {
      bitmap.close();
      return setError("Use a square PNG frame, ideally 1080 × 1080 or larger.");
    }
    bitmap.close();
    if (frameUrl) URL.revokeObjectURL(frameUrl);
    setFrame(file);
    setFrameUrl(URL.createObjectURL(file));
  }

  function updateTitle(value: string) {
    setTitle(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  }

  async function makeThumbnail() {
    const [personBlob] = await Promise.all([
      fetch(thumbnails[thumbnail]).then((response) => response.blob()),
    ]);
    const person = await createImageBitmap(personBlob);
    const overlay = await createImageBitmap(frame!);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1080;
    const context = canvas.getContext("2d")!;
    const scale = Math.max(1080 / person.width, 1080 / person.height);
    const width = person.width * scale;
    const height = person.height * scale;
    context.drawImage(
      person,
      (1080 - width) / 2,
      (1080 - height) / 2,
      width,
      height,
    );
    context.drawImage(overlay, 0, 0, 1080, 1080);
    person.close();
    overlay.close();
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Thumbnail could not be created.")),
        "image/png",
      ),
    );
  }

  async function uploadAsset(asset: Blob, kind: "frame" | "brand") {
    const response = await fetch(`/api/admin/assets?kind=${kind}`, {
      method: "POST",
      headers: { "Content-Type": asset.type },
      body: asset,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Image upload failed.");
    return data.url as string;
  }

  async function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!frame) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const password = String(form.get("password") || "");
      const confirmation = String(form.get("confirmation") || "");
      if (authMode === "signup" && password !== confirmation)
        throw new Error("Passwords do not match.");
      const login = await fetch(
        `/api/auth/${authMode === "signup" ? "signup" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(authMode === "signup" ? { name: form.get("name") } : {}),
            email: form.get("email"),
            password,
          }),
        },
      );
      const loginData = await login.json().catch(() => ({}));
      if (!login.ok) throw new Error(loginData.error || "Sign in failed.");

      const [frameAsset, coverAsset] = await Promise.all([
        uploadAsset(frame, "frame"),
        makeThumbnail().then((blob) => uploadAsset(blob, "brand")),
      ]);
      const campaign = {
        ...emptyCampaign,
        id: "",
        name: title.trim(),
        slug,
        organization_name: "Framezi Creator",
        title: title.trim(),
        description: description.trim(),
        cover_url: coverAsset,
        status: "published" as const,
        require_name: false,
        require_email: false,
        frames: [
          {
            id: crypto.randomUUID(),
            name: title.trim(),
            frame_url: frameAsset,
            thumbnail_url: frameAsset,
            sort_order: 0,
            is_active: true,
          },
        ],
      };
      const saved = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaign),
      });
      const savedData = await saved.json().catch(() => ({}));
      if (!saved.ok)
        throw new Error(savedData.error || "Campaign could not be published.");
      window.location.assign(`/${slug}`);
    } catch (reason) {
      setError((reason as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="creator-page">
      <header className="creator-header">
        <Link href="/" aria-label="Close campaign creator">
          <X size={24} />
        </Link>
        <strong>
          {step === 0
            ? "Photo frame campaign"
            : step === 1
              ? "Campaign details"
              : step === 2
                ? "Campaign thumbnail"
                : "Publish campaign"}
        </strong>
        <span>{step + 1} / 4</span>
      </header>

      <section className="creator-card">
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        {step === 0 && (
          <div className="creator-upload-step">
            <div className="creator-step-icon">
              <ImagePlus size={28} />
            </div>
            <h1>Upload your frame</h1>
            <p>
              Use a square transparent PNG that places artwork around the photo
              area.
            </p>
            <label className={`creator-upload ${frameUrl ? "has-frame" : ""}`}>
              {frameUrl ? (
                <img src={frameUrl} alt="Your uploaded frame" />
              ) : (
                <>
                  <Upload size={30} />
                  <strong>Upload your design here</strong>
                  <span>
                    PNG · maximum 4 MB
                    <br />
                    Recommended: 1080 × 1080 px
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/png"
                onChange={(event) => void chooseFrame(event.target.files?.[0])}
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="creator-details-step">
            <div className="creator-step-title">
              <span>
                <List size={20} />
              </span>
              <h1>Campaign details</h1>
            </div>
            <label>
              Campaign title
              <input
                value={title}
                maxLength={80}
                onChange={(event) => updateTitle(event.target.value)}
                placeholder="Give your campaign a clear title"
              />
            </label>
            <label>
              Description <small>(optional)</small>
              <textarea
                value={description}
                maxLength={250}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Share what this campaign is about"
              />
              <span>{description.length}/250</span>
            </label>
            <label>
              Campaign link
              <div className="creator-link-input">
                <span>framezi.com/</span>
                <input
                  value={slug}
                  onChange={(event) =>
                    setSlug(
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  placeholder="campaign-link"
                />
              </div>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="creator-thumbnail-step">
            <h1>Choose a campaign thumbnail</h1>
            <p>This preview helps people recognise your campaign.</p>
            <div className="creator-thumbnail-preview">
              <img
                src={thumbnails[thumbnail]}
                alt="Selected campaign thumbnail portrait"
              />
              <img src={frameUrl} alt="" />
            </div>
            <div className="creator-thumbnail-options">
              {thumbnails.map((source, index) => (
                <button
                  className={thumbnail === index ? "selected" : ""}
                  key={source}
                  type="button"
                  aria-label={`Use thumbnail ${index + 1}`}
                  onClick={() => setThumbnail(index)}
                >
                  <img src={source} alt="" />
                  {thumbnail === index && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <form className="creator-login-step" onSubmit={publish}>
            <div className="creator-step-icon">
              <LockKeyhole size={26} />
            </div>
            <h1>
              {authMode === "signup"
                ? "Create your free profile"
                : "Sign in to publish"}
            </h1>
            <p>
              {authMode === "signup"
                ? "No email code or payment. Create a profile and publish your campaign now."
                : "Welcome back. Sign in to publish this campaign."}
            </p>
            <div className="creator-auth-tabs">
              <button
                type="button"
                className={authMode === "signup" ? "active" : ""}
                onClick={() => setAuthMode("signup")}
              >
                Create profile
              </button>
              <button
                type="button"
                className={authMode === "login" ? "active" : ""}
                onClick={() => setAuthMode("login")}
              >
                Sign in
              </button>
            </div>
            {authMode === "signup" && (
              <label>
                Name
                <input
                  type="text"
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Enter your name"
                />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                name="email"
                required
                autoComplete="username"
                placeholder="you@organization.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                required
                minLength={authMode === "signup" ? 8 : 1}
                autoComplete={
                  authMode === "signup" ? "new-password" : "current-password"
                }
                placeholder={
                  authMode === "signup"
                    ? "At least 8 characters"
                    : "Enter password"
                }
              />
            </label>
            {authMode === "signup" && (
              <label>
                Confirm password
                <input
                  type="password"
                  name="confirmation"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                />
              </label>
            )}
            <button className="button full" disabled={busy}>
              {busy
                ? "Publishing…"
                : authMode === "signup"
                  ? "Create profile and publish"
                  : "Sign in and publish"}{" "}
              <ArrowRight size={17} />
            </button>
            <small>Free during launch · no payment · no watermark.</small>
          </form>
        )}
      </section>

      {step < 3 && (
        <footer className="creator-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => (step === 0 ? history.back() : setStep(step - 1))}
          >
            <ArrowLeft size={17} /> Back
          </button>
          <div className="creator-progress">
            {[0, 1, 2, 3].map((value) => (
              <span className={value <= step ? "active" : ""} key={value} />
            ))}
          </div>
          <button
            type="button"
            className="button"
            disabled={!canContinue}
            onClick={() => setStep(step + 1)}
          >
            Next <ArrowRight size={17} />
          </button>
        </footer>
      )}
    </main>
  );
}
