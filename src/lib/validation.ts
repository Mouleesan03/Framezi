import { z } from "zod";
const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v),
      "Invalid characters",
    );
const asset = z
  .string()
  .max(1000)
  .refine(
    (v) =>
      !v ||
      v.startsWith("/frames/") ||
      (/^https:\/\//.test(v) && !/[<>"']/.test(v)),
    "Use an HTTPS asset URL",
  );
export const registrationSchema = z
  .object({
    campaign_id: z.uuid(),
    name: safeText(60),
    email: z.union([z.email().max(150), z.literal("")]),
    consent: z.literal(true),
    marketing_consent: z.boolean(),
  })
  .strict();
export const eventSchema = z
  .object({
    campaign_id: z.uuid(),
    submission_id: z.uuid().optional(),
    event_type: z.enum([
      "campaign_view",
      "photo_selected",
      "frame_selected",
      "generated",
      "download_png",
      "download_jpg",
      "share",
      "facebook_click",
    ]),
    frame_id: z.uuid().optional(),
    generation_id: z.uuid().optional(),
  })
  .strict();
export const campaignSchema = z
  .object({
    id: z.union([z.uuid(), z.literal("")]),
    name: safeText(160).min(1),
    slug: z
      .string()
      .min(3)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .refine(
        (v) =>
          ![
            "admin",
            "api",
            "privacy",
            "terms",
            "demo",
            "favicon",
            "manifest",
          ].includes(v),
        "Reserved slug",
      ),
    short_code: z.string().regex(/^[a-zA-Z0-9_-]{4,16}$/).optional(),
    organization_name: safeText(160).min(1),
    title: safeText(160).min(1),
    description: safeText(1500),
    logo_url: asset,
    cover_url: asset,
    primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    event_date_text: safeText(150),
    location: safeText(160),
    status: z.enum(["draft", "published", "ended", "archived"]),
    start_at: z.string().datetime().nullable(),
    end_at: z.string().datetime().nullable(),
    require_name: z.boolean(),
    require_email: z.boolean(),
    show_name_on_image: z.boolean(),
    enable_face_centering: z.boolean(),
    enable_share: z.boolean(),
    enable_facebook: z.boolean(),
    enable_png: z.boolean(),
    enable_jpg: z.boolean(),
    allow_duplicate_emails: z.boolean(),
    allow_after_end: z.boolean(),
    share_text: safeText(1000),
    privacy_text: safeText(1500),
    cta_text: safeText(80),
    filename_prefix: safeText(50),
    thank_you_text: safeText(500),
    name_position: z.enum(["top", "bottom", "custom"]),
    name_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    name_font: z.enum(["Arial", "Georgia", "Verdana"]),
    name_font_size: z.number().min(20).max(160),
    frames: z
      .array(
        z.object({
          id: z.uuid(),
          name: safeText(80).min(1),
          frame_url: asset.refine(Boolean, "Frame required"),
          thumbnail_url: asset,
          sort_order: z.number().int().min(0),
          is_active: z.boolean(),
        }),
      )
      .max(3),
    created_at: z.string().optional(),
  })
  .refine(
    (c) =>
      !c.start_at || !c.end_at || Date.parse(c.end_at) > Date.parse(c.start_at),
    "End date must follow start date",
  )
  .refine(
    (c) => c.status !== "published" || c.frames.some((f) => f.is_active),
    "Publishing requires an enabled frame",
  )
  .refine(
    (c) => c.enable_png || c.enable_jpg,
    "Enable at least one download format",
  );
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
