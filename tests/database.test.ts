import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { demoCampaign } from "../src/lib/demo";
test("PostgreSQL migration, RLS, registration, deduplication and admin save", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,bucket_id text);alter table storage.objects enable row level security;`,
    );
    await db.exec(
      readFileSync("supabase/migrations/001_framezi.sql", "utf8").replace(
        "create extension if not exists pgcrypto;",
        "",
      ),
    );
    await db.exec(readFileSync("supabase/migrations/002_public_campaign_stats.sql", "utf8"));
    await db.exec(
      `grant select,insert,update,delete on campaigns,campaign_frames to anon,authenticated;grant select on profiles to authenticated;grant all on all tables in schema public to service_role;`,
    );
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
    const cid = demoCampaign.id;
    await db.exec("set role anon");
    assert.equal((await db.query("select * from campaigns")).rows.length, 2);
    await assert.rejects(db.query("select * from participants"));
    await assert.rejects(
      db.query(`select register_participant($1,'A','a@example.com',false)`, [
        cid,
      ]),
    );
    await assert.rejects(
      db
        .query(`update campaigns set title='hacked' where id=$1 returning id`, [
          cid,
        ])
        .then((result) => {
          assert.equal(result.rows.length, 1);
        }),
    );
    await db.exec("reset role;set role service_role");
    const { rows } = await db.query<{ id: string }>(
      "select register_participant($1,$2,$3,$4) as id",
      [cid, "QA Graduate", "qa@example.com", false],
    );
    const pid = rows[0].id;
    await db.query(
      "update campaigns set allow_duplicate_emails=false where id=$1",
      [cid],
    );
    await assert.rejects(
      db.query("select register_participant($1,$2,$3,$4)", [
        cid,
        "QA",
        "QA@example.com",
        true,
      ]),
    );
    const gen = "00000000-0000-4000-8000-000000000099";
    const frame = demoCampaign.frames[0].id;
    await db.query("select record_event($1,$2,$3,$4,$5)", [
      cid,
      pid,
      "generated",
      frame,
      gen,
    ]);
    await db.query("select record_event($1,$2,$3,$4,$5)", [
      cid,
      pid,
      "generated",
      frame,
      gen,
    ]);
    await db.query("select record_event($1,$2,$3,$4,$5)", [
      cid,
      pid,
      "download_png",
      frame,
      gen,
    ]);
    assert.equal(
      (
        await db.query<{ n: number }>(
          `select count(*)::integer n from campaign_events where event_type='generated'`,
        )
      ).rows[0].n,
      1,
    );
    assert.equal(
      (await db.query<{ n: number }>("select campaign_usage_count($1)::integer n", [cid])).rows[0].n,
      1,
    );
    assert.ok(
      (await db.query<{ short_code: string }>("select short_code from campaigns where id=$1", [cid])).rows[0].short_code,
    );
    assert.ok(
      (
        await db.query<{ generated_at: string; downloaded_at: string }>(
          "select generated_at,downloaded_at from participants where id=$1",
          [pid],
        )
      ).rows[0].downloaded_at,
    );
    await assert.rejects(
      db.query("select record_event($1,$2,$3,$4,$5)", [
        cid,
        "00000000-0000-4000-8000-000000000088",
        "generated",
        frame,
        gen,
      ]),
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>("select check_rate_limit($1,1) ok", [
          "test",
        ])
      ).rows[0].ok,
      true,
    );
    assert.equal(
      (
        await db.query<{ ok: boolean }>("select check_rate_limit($1,1) ok", [
          "test",
        ])
      ).rows[0].ok,
      false,
    );
    await db.exec(
      `reset role;insert into auth.users values('00000000-0000-4000-8000-000000000010');insert into profiles(id,email) values('00000000-0000-4000-8000-000000000010','admin@example.com');set role authenticated;set request.jwt.claim.sub='00000000-0000-4000-8000-000000000010';`,
    );
    assert.equal((await db.query("select * from participants")).rows.length, 1);
    const copy = {
      ...demoCampaign,
      id: "",
      slug: "test-campaign",
      short_code: undefined,
      status: "draft",
      frames: demoCampaign.frames.map((f, i) => ({
        ...f,
        id: `00000000-0000-4000-8000-00000000002${i}`,
      })),
    };
    const saved = await db.query<{ id: string }>(
      "select save_campaign($1::jsonb) id",
      [JSON.stringify(copy)],
    );
    assert.ok(saved.rows[0].id);
    assert.equal(
      (
        await db.query("select * from campaign_frames where campaign_id=$1", [
          saved.rows[0].id,
        ])
      ).rows.length,
      copy.frames.length,
    );
    await db.query("select save_campaign($1::jsonb)", [
      JSON.stringify({ ...copy, id: saved.rows[0].id, title: "Updated title" }),
    ]);
    await db.exec("reset role;set role anon");
    assert.equal((await db.query("select * from campaigns")).rows.length, 2);
    await db.exec(
      `reset role;set role authenticated;set request.jwt.claim.sub='00000000-0000-4000-8000-000000000011';`,
    );
    assert.equal((await db.query("select * from participants")).rows.length, 0);
    await assert.rejects(
      db.query("select save_campaign($1::jsonb)", [JSON.stringify(copy)]),
    );
  } finally {
    await db.close();
  }
});
