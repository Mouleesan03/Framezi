import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  registrationSchema,
  eventSchema,
  campaignSchema,
  csvCell,
} from "../src/lib/validation";
import { demoCampaign, isOpen } from "../src/lib/demo";
test("registration accepts only metadata and separate consent", () => {
  const valid = {
    campaign_id: demoCampaign.id,
    name: "A <Graduate>",
    email: "a@example.com",
    consent: true,
    marketing_consent: false,
  };
  assert.ok(registrationSchema.safeParse(valid).success);
  for (const key of ["photo", "image", "photo_base64", "blob", "photo_url"])
    assert.equal(
      registrationSchema.safeParse({ ...valid, [key]: "secret" }).success,
      false,
    );
  assert.equal(
    registrationSchema.safeParse({ ...valid, consent: false }).success,
    false,
  );
  assert.equal(
    registrationSchema.safeParse({ ...valid, email: "invalid" }).success,
    false,
  );
  assert.equal(
    registrationSchema.safeParse({ ...valid, name: "a".repeat(61) }).success,
    false,
  );
});
test("events exclude image information and unsupported event types", () => {
  const event = { campaign_id: demoCampaign.id, event_type: "photo_selected" };
  assert.ok(eventSchema.safeParse(event).success);
  for (const key of ["filename", "exif", "dimensions", "face", "photo"])
    assert.equal(
      eventSchema.safeParse({ ...event, [key]: "private" }).success,
      false,
    );
  assert.equal(
    eventSchema.safeParse({ ...event, event_type: "arbitrary" }).success,
    false,
  );
});
test("campaign validation rejects unsafe slugs, missing frames and invalid dates", () => {
  assert.ok(campaignSchema.safeParse(demoCampaign).success);
  assert.equal(
    campaignSchema.safeParse({ ...demoCampaign, slug: "admin" }).success,
    false,
  );
  assert.equal(
    campaignSchema.safeParse({ ...demoCampaign, frames: [] }).success,
    false,
  );
  assert.equal(
    campaignSchema.safeParse({
      ...demoCampaign,
      logo_url: "javascript:alert(1)",
    }).success,
    false,
  );
  assert.equal(
    campaignSchema.safeParse({
      ...demoCampaign,
      start_at: "2026-10-02T00:00:00Z",
      end_at: "2026-10-01T00:00:00Z",
    }).success,
    false,
  );
});
test("CSV neutralizes formula injection and escapes quotes", () => {
  assert.equal(csvCell("=SUM(A1)"), '"\'=SUM(A1)"');
  assert.equal(csvCell('A,"B"'), '"A,""B"""');
});
test("campaign availability honors schedule and explicit status", () => {
  assert.equal(isOpen({ ...demoCampaign, status: "draft" }), false);
  assert.equal(
    isOpen({ ...demoCampaign, end_at: "2020-01-01T00:00:00Z" }),
    false,
  );
  assert.equal(
    isOpen({
      ...demoCampaign,
      end_at: "2020-01-01T00:00:00Z",
      allow_after_end: true,
    }),
    true,
  );
  assert.equal(
    isOpen({ ...demoCampaign, start_at: "2099-01-01T00:00:00Z" }),
    false,
  );
});
test("photo processing has no transport or browser persistence", () => {
  const canvas = readFileSync("src/lib/canvas/index.ts", "utf8");
  assert.doesNotMatch(
    canvas,
    /fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon/,
  );
  const editor = readFileSync("src/components/CampaignApp.tsx", "utf8");
  assert.doesNotMatch(
    editor,
    /localStorage|sessionStorage|FormData|toDataURL|base64|sendBeacon/,
  );
  assert.equal((editor.match(/fetch\(/g) || []).length, 2);
  const db = readFileSync("supabase/migrations/001_framezi.sql", "utf8");
  assert.doesNotMatch(
    db,
    /photo_url|photo_base64|photo_blob|generated_photo|original_photo/,
  );
});

test("same-origin checks use public host behind internal Next bind address", async () => {
  const { sameOrigin } = await import("../src/lib/origin");
  const request = (origin: string) =>
    new Request("http://0.0.0.0:3000/api/register", {
      headers: { host: "localhost:3000", origin },
    });
  assert.equal(sameOrigin(request("http://localhost:3000")), true);
  assert.equal(sameOrigin(request("https://attacker.example")), false);
  assert.equal(sameOrigin(request("null")), false);
});
