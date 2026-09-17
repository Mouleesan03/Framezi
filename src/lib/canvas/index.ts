import type { Campaign } from "@/lib/types";
export type CropArea = { x: number; y: number; width: number; height: number };
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (!url.startsWith("blob:")) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          "Unable to load this image. Please choose another photo or frame.",
        ),
      );
    image.src = url;
  });
}
export async function normalizeImageOrientation(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "This photo format isn't supported by your browser. Please choose a JPG, PNG or WEBP photo.",
    );
  }
  try {
    const scale = Math.min(1, 4096 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not create an image editor.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await exportPNG(canvas);
  } finally {
    bitmap.close();
  }
}
export async function loadImageFromFile(file: File) {
  if (file.size > 15 * 1024 * 1024)
    throw new Error("Please choose a photo smaller than 15 MB.");
  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ].includes(file.type)
  )
    throw new Error(
      "This photo format isn't supported by your browser. Please choose a JPG, PNG or WEBP photo.",
    );
  return URL.createObjectURL(await normalizeImageOrientation(file));
}
export function calculateCrop(width: number, height: number): CropArea {
  const size = Math.min(width, height);
  return {
    x: (width - size) / 2,
    y: (height - size) / 2,
    width: size,
    height: size,
  };
}
export function drawPhoto(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  area: CropArea,
  rotation: number,
  size: number,
) {
  const rad = (rotation * Math.PI) / 180;
  const w =
    Math.abs(Math.cos(rad) * image.width) +
    Math.abs(Math.sin(rad) * image.height);
  const h =
    Math.abs(Math.sin(rad) * image.width) +
    Math.abs(Math.cos(rad) * image.height);
  const rotated = document.createElement("canvas");
  rotated.width = Math.round(w);
  rotated.height = Math.round(h);
  const r = rotated.getContext("2d");
  if (!r) throw new Error("Image rendering unavailable");
  r.translate(w / 2, h / 2);
  r.rotate(rad);
  r.drawImage(image, -image.width / 2, -image.height / 2);
  ctx.drawImage(
    rotated,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    size,
    size,
  );
  rotated.width = rotated.height = 0;
}
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: HTMLImageElement,
  size: number,
) {
  ctx.drawImage(frame, 0, 0, size, size);
}
export function drawParticipantName(
  ctx: CanvasRenderingContext2D,
  name: string,
  c: Campaign,
  size: number,
) {
  if (!c.show_name_on_image || !name) return;
  let fontSize = (c.name_font_size * size) / 2160;
  ctx.fillStyle = c.name_color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${fontSize}px ${c.name_font}`;
  while (ctx.measureText(name).width > size * 0.82 && fontSize > 12) {
    fontSize -= 1;
    ctx.font = `600 ${fontSize}px ${c.name_font}`;
  }
  ctx.fillText(
    name,
    size / 2,
    size *
      (c.name_position === "top"
        ? 0.085
        : c.name_position === "custom"
          ? 0.87
          : 0.947),
  );
}
export function renderFrame(
  image: HTMLImageElement,
  frame: HTMLImageElement,
  area: CropArea,
  rotation: number,
  c: Campaign,
  name: string,
  size = 2160,
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.imageSmoothingQuality = "high";
  drawPhoto(ctx, image, area, rotation, size);
  drawFrame(ctx, frame, size);
  drawParticipantName(ctx, name, c, size);
  return canvas;
}
export function exportPNG(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(new Error("Unable to export image. Please try again.")),
      "image/png",
    ),
  );
}
export function exportJPG(canvas: HTMLCanvasElement): Promise<Blob> {
  const white = document.createElement("canvas");
  white.width = canvas.width;
  white.height = canvas.height;
  const ctx = white.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas unavailable"));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, white.width, white.height);
  ctx.drawImage(canvas, 0, 0);
  return new Promise((resolve, reject) =>
    white.toBlob(
      (b) => {
        white.width = white.height = 0;
        b ? resolve(b) : reject(new Error("Unable to export JPG."));
      },
      "image/jpeg",
      0.95,
    ),
  );
}
export function createShareFile(blob: Blob, filename: string) {
  return new File([blob], filename, { type: blob.type });
}
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function safeFilename(value: string) {
  return (
    value
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}_-]+/gu, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100) || "frame"
  );
}
