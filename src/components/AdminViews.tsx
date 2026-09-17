"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Layers,
  Users,
  Image,
  Download,
  Share2,
  ArrowUpRight,
  Copy,
  ChartNoAxesCombined,
  Eye,
  Search,
  Check,
  Settings,
} from "lucide-react";
import QRCode from "qrcode";
import type { Campaign, Participant, Event } from "@/lib/types";
import { csvCell } from "@/lib/validation";
import { saveBlob } from "@/lib/canvas";
type Props = {
  view: string;
  campaigns: Campaign[];
  participants: Participant[];
  events: Event[];
  campaign?: Campaign;
};
function Stats({
  campaigns,
  participants,
  events,
  analytics = false,
}: Omit<Props, "view"> & { analytics?: boolean }) {
  const values = analytics
    ? [
        [
          Eye,
          "Campaign views",
          events.filter((e) => e.event_type === "campaign_view").length,
        ],
        [Users, "Participants", participants.length],
        [
          Image,
          "Frames generated",
          events.filter((e) => e.event_type === "generated").length,
        ],
        [
          Download,
          "PNG downloads",
          events.filter((e) => e.event_type === "download_png").length,
        ],
        [
          Download,
          "JPG downloads",
          events.filter((e) => e.event_type === "download_jpg").length,
        ],
        [
          Share2,
          "Shares",
          events.filter((e) =>
            ["share", "facebook_click"].includes(e.event_type),
          ).length,
        ],
      ]
    : [
        [Layers, "Total campaigns", campaigns.length],
        [
          Layers,
          "Active campaigns",
          campaigns.filter(
            (c) =>
              c.status === "published" &&
              (!c.end_at ||
                Date.parse(c.end_at) > Date.now() ||
                c.allow_after_end),
          ).length,
        ],
        [Users, "Total participants", participants.length],
        [
          Image,
          "Images generated",
          events.filter((e) => e.event_type === "generated").length,
        ],
        [
          Download,
          "Downloads",
          events.filter((e) => e.event_type.startsWith("download_")).length,
        ],
        [
          Share2,
          "Shares",
          events.filter((e) =>
            ["share", "facebook_click"].includes(e.event_type),
          ).length,
        ],
      ];
  return (
    <div className="stats-grid">
      {values.map(([Icon, label, value]) => {
        const I = Icon as typeof Users;
        return (
          <div className="stat" key={String(label)}>
            <div className="stat-label">
              {String(label)}
              <I size={18} />
            </div>
            <strong>{Number(value).toLocaleString()}</strong>
          </div>
        );
      })}
    </div>
  );
}
function CampaignTable({
  campaigns,
  participants,
}: {
  campaigns: Campaign[];
  participants: Participant[];
}) {
  return (
    <div className="panel table-panel">
      <h2>Campaigns</h2>
      {campaigns.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Participants</th>
                <th>Event date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/campaigns/${c.id}`}>{c.name}</Link>
                    <small>{c.organization_name}</small>
                  </td>
                  <td>
                    <span className={`badge ${c.status}`}>{c.status}</span>
                  </td>
                  <td>
                    {participants.filter((p) => p.campaign_id === c.id).length}
                  </td>
                  <td>{c.event_date_text || "—"}</td>
                  <td>
                    <Link
                      href={`/admin/campaigns/${c.id}`}
                      aria-label={`Open ${c.name}`}
                    >
                      <ArrowUpRight size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <Layers size={35} />
          <h3>Your first celebration starts here.</h3>
          <p>Create a campaign and invite your community.</p>
          <Link
            className="button"
            style={{ marginTop: 20 }}
            href="/admin/campaigns/new"
          >
            <Plus size={17} /> Create Campaign
          </Link>
        </div>
      )}
    </div>
  );
}
function Participants({
  participants,
  campaigns,
}: {
  participants: Participant[];
  campaigns: Campaign[];
}) {
  const [query, setQuery] = useState("");
  const [campaign, setCampaign] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(0);
  const filtered = participants.filter(
    (p) =>
      (!campaign || p.campaign_id === campaign) &&
      (!date || p.registered_at.slice(0, 10) === date) &&
      `${p.name} ${p.email}`.toLowerCase().includes(query.toLowerCase()),
  );
  const campaignName = (id: string) =>
    campaigns.find((c) => c.id === id)?.name || "Deleted campaign";
  function exportCSV() {
    const rows = [
      [
        "Name",
        "Email",
        "Campaign",
        "Registration Date",
        "Generated",
        "Downloaded",
        "Shared",
        "Marketing Consent",
      ],
      ...filtered.map((p) => [
        p.name,
        p.email,
        campaignName(p.campaign_id),
        p.registered_at,
        Boolean(p.generated_at),
        Boolean(p.downloaded_at),
        Boolean(p.shared_at),
        p.marketing_consent,
      ]),
    ];
    saveBlob(
      new Blob(
        ["\ufeff" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
      "Framezi-participants.csv",
    );
  }
  return (
    <>
      <div className="toolbar">
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search
            size={17}
            style={{
              position: "absolute",
              left: 13,
              top: 14,
              color: "#98a2b3",
            }}
          />
          <input
            className="search-input"
            style={{ paddingLeft: 39 }}
            aria-label="Search participants"
            placeholder="Search name or email…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <select
          aria-label="Filter campaign"
          value={campaign}
          onChange={(e) => {
            setCampaign(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All campaigns</option>
          {campaigns.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Registration date"
          className="search-input"
          style={{ width: 160 }}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(0);
          }}
        />
        <button className="button secondary" onClick={exportCSV}>
          <Download size={16} /> Export CSV
        </button>
      </div>
      <div className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Name",
                  "Email",
                  "Campaign",
                  "Registered at",
                  "Generated",
                  "Downloaded",
                  "Shared",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(page * 25, (page + 1) * 25).map((p) => (
                <tr key={p.id}>
                  <td>{p.name || "—"}</td>
                  <td>{p.email || "—"}</td>
                  <td>{campaignName(p.campaign_id)}</td>
                  <td>{new Date(p.registered_at).toLocaleString()}</td>
                  {[p.generated_at, p.downloaded_at, p.shared_at].map(
                    (v, i) => (
                      <td key={i}>
                        {v ? <Check size={17} color="#12b76a" /> : "—"}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="empty">
            <Users size={32} />
            <h3>No participants yet.</h3>
            <p>Registrations will appear here. Photographs never will.</p>
          </div>
        )}
        <div
          className="toolbar"
          style={{ padding: 15, margin: 0, justifyContent: "space-between" }}
        >
          <small>
            {filtered.length} participants · Page {page + 1} of{" "}
            {Math.max(1, Math.ceil(filtered.length / 25))}
          </small>
          <div className="actions">
            <button
              className="button secondary small"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button
              className="button secondary small"
              disabled={(page + 1) * 25 >= filtered.length}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
function Chart({ title, dates }: { title: string; dates: string[] }) {
  const counts = new Map<string, number>();
  dates.forEach((date) => {
    const key = date.slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const days = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(1, ...days.map((d) => d[1]));
  return (
    <section className="panel">
      <h2>{title}</h2>
      {days.length ? (
        <div
          className="chart"
          role="img"
          aria-label={days.map(([date, n]) => `${date}: ${n}`).join(", ")}
        >
          {days.map(([date, n]) => (
            <div key={date} className="chart-col" title={`${date}: ${n}`}>
              <b>{n}</b>
              <div
                className="chart-bar"
                style={{ height: `${(n / max) * 125}px` }}
              />
              <span>{date.slice(5)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty" style={{ padding: 35 }}>
          No activity in this period.
        </div>
      )}
    </section>
  );
}
function Analytics({ campaigns, participants, events }: Omit<Props, "view">) {
  const [range, setRange] = useState("30");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const today = new Date();
  const min =
    range === "all"
      ? 0
      : range === "custom"
        ? start
          ? Date.parse(start)
          : 0
        : range === "today"
          ? new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
            ).getTime()
          : Date.now() - Number(range) * 86400000;
  const max = range === "custom" && end ? Date.parse(end) + 86400000 : Infinity;
  const within = (date: string) =>
    Date.parse(date) >= min && Date.parse(date) < max;
  const ps = participants.filter((p) => within(p.registered_at));
  const es = events.filter((e) => within(e.created_at));
  return (
    <>
      <div className="toolbar">
        <select
          aria-label="Analytics date range"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="today">Today</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="all">All Time</option>
          <option value="custom">Custom Date Range</option>
        </select>
        {range === "custom" && (
          <>
            <input
              type="date"
              className="search-input"
              aria-label="Start date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <input
              type="date"
              className="search-input"
              aria-label="End date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </>
        )}
      </div>
      <Stats campaigns={campaigns} participants={ps} events={es} analytics />
      <div className="analytics-grid">
        <Chart
          title="Participants by day"
          dates={ps.map((p) => p.registered_at)}
        />
        <Chart
          title="Frames generated by day"
          dates={es
            .filter((e) => e.event_type === "generated")
            .map((e) => e.created_at)}
        />
        <Chart
          title="Downloads by day"
          dates={es
            .filter((e) => e.event_type.startsWith("download_"))
            .map((e) => e.created_at)}
        />
        <div className="panel">
          <h2>Frame popularity</h2>
          {campaigns
            .flatMap((c) => c.frames)
            .map((f) => {
              const n = es.filter(
                (e) => e.event_type === "generated" && e.frame_id === f.id,
              ).length;
              return (
                <div key={f.id} style={{ margin: "16px 0" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span>{f.name}</span>
                    <strong>{n}</strong>
                  </div>
                  <div
                    style={{
                      height: 7,
                      background: "#eff4ff",
                      borderRadius: 5,
                      marginTop: 8,
                    }}
                  >
                    <div
                      style={{
                        height: 7,
                        background: "#155eef",
                        borderRadius: 5,
                        width: `${(n / Math.max(1, es.filter((e) => e.event_type === "generated").length)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          {!campaigns.some((c) => c.frames.length) && (
            <p className="muted">
              Frame usage will appear after a frame is generated.
            </p>
          )}
        </div>
      </div>
      <p className="offline-note">
        Views are page visits, not unique people. Share counts include native
        shares and Facebook button clicks.
      </p>
    </>
  );
}
function Overview({
  campaign: c,
  participants,
  events,
}: Required<Pick<Props, "campaign">> & Pick<Props, "participants" | "events">) {
  const router = useRouter();
  const [url, setUrl] = useState("/" + c.slug);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const qr = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const link = window.location.origin + "/" + c.slug;
    setUrl(link);
    if (qr.current)
      QRCode.toCanvas(qr.current, link, {
        width: 240,
        margin: 2,
        color: { dark: "#101828", light: "#ffffff" },
      }).catch(() => setMessage("Unable to create QR code."));
  }, [c.slug]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied!");
    } catch {
      setMessage("Copy the campaign URL shown below.");
    }
  }
  async function action(kind: string) {
    setBusy(true);
    setMessage("");
    try {
      const next = { ...c };
      if (kind === "duplicate") {
        next.id = "";
        next.name += " (copy)";
        next.slug += "-copy-" + crypto.randomUUID().slice(0, 5);
        next.status = "draft";
        next.frames = next.frames.map((f) => ({
          ...f,
          id: crypto.randomUUID(),
        }));
      } else if (kind === "archive") next.status = "archived";
      else next.status = c.status === "published" ? "draft" : "published";
      const r = await fetch("/api/admin/campaigns", {
        method: kind === "delete" ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kind === "delete" ? { id: c.id } : next),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      router.push(
        kind === "delete" ? "/admin/campaigns" : `/admin/campaigns/${data.id}`,
      );
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="actions">
        <Link href={`/${c.slug}?preview=1`} className="button" target="_blank">
          <Eye size={16} /> View Campaign
        </Link>
        <Link
          className="button secondary"
          href={`/admin/campaigns/${c.id}/edit`}
        >
          Edit campaign
        </Link>
        <Link
          className="button secondary"
          href={`/admin/campaigns/${c.id}/analytics`}
        >
          <ChartNoAxesCombined size={17} /> Analytics
        </Link>
        <button className="button secondary" onClick={copy}>
          <Copy size={16} /> Copy Link
        </button>
      </div>
      <Stats
        campaigns={[c]}
        participants={participants}
        events={events}
        analytics
      />
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <div className="panel">
        <h2>Invite your community</h2>
        <div className="qr-panel">
          <canvas ref={qr} aria-label="Campaign QR code" />
          <div>
            <p style={{ overflowWrap: "anywhere" }}>{url}</p>
            <p className="offline-note">
              {c.status === "published"
                ? "Share this link or print the QR code."
                : "Publish your campaign to make this link available to visitors."}
            </p>
            <div className="actions">
              <button
                className="button secondary"
                onClick={() =>
                  qr.current?.toBlob(
                    (b) => b && saveBlob(b, `Framezi-${c.slug}-QR.png`),
                  )
                }
              >
                <Download size={16} /> Download QR
              </button>
              <button className="button secondary" onClick={copy}>
                <Copy size={16} /> Copy Campaign URL
              </button>
            </div>
          </div>
        </div>
      </div>
      <section className="panel" style={{ marginTop: 22 }}>
        <h2>Campaign management</h2>
        <div className="actions">
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => action("toggle")}
          >
            {c.status === "published" ? "Unpublish" : "Publish"}
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => action("duplicate")}
          >
            Duplicate
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => action("archive")}
          >
            Archive
          </button>
          <button
            className="button secondary danger"
            onClick={() => setConfirmDelete(true)}
          >
            Delete campaign
          </button>
        </div>
        {confirmDelete && (
          <div className="error">
            <p style={{ color: "inherit", marginBottom: 12 }}>
              Permanently delete this campaign, its registrations, and
              analytics? This cannot be undone.
            </p>
            <div className="actions">
              <button
                className="button secondary danger"
                disabled={busy}
                onClick={() => action("delete")}
              >
                Delete permanently
              </button>
              <button
                className="button secondary"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
export default function AdminViews(props: Props) {
  const { view, campaigns, participants, events, campaign } = props;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const title = campaign
    ? campaign.name
    : {
        dashboard: "Your moments, at a glance.",
        campaigns: "Campaigns",
        submissions: "Submissions",
        analytics: "Campaign analytics",
        settings: "Workspace settings",
      }[view] || "Dashboard";
  return (
    <main className="page-shell">
      <div className="page-heading">
        <div>
          <span className="eyebrow" style={{ marginBottom: 8 }}>
            {campaign ? campaign.organization_name : "FRAMEZI WORKSPACE"}
          </span>
          <h1>{title}</h1>
          <p>
            {campaign ? (
              <span className={`badge ${campaign.status}`}>
                {campaign.status}
              </span>
            ) : view === "dashboard" ? (
              "A little overview of the celebrations you’re creating."
            ) : view === "submissions" ? (
              "Your participants and their activity. No photographs stored."
            ) : (
              "Create, manage, and celebrate with your community."
            )}
          </p>
        </div>
        {["dashboard", "campaigns"].includes(view) && !campaign && (
          <Link className="button" href="/admin/campaigns/new">
            <Plus size={17} /> Create Campaign
          </Link>
        )}
      </div>
      {view === "dashboard" && (
        <>
          <Stats {...props} />
          <CampaignTable
            campaigns={campaigns.slice(0, 5)}
            participants={participants}
          />
          <section className="panel" style={{ marginTop: 22 }}>
            <h2>Recent participant activity</h2>
            {participants.length ? (
              participants.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #e7eaf0",
                    padding: "14px 0",
                    gap: 12,
                    fontSize: 14,
                  }}
                >
                  <div>
                    <strong>{p.name || "Participant"}</strong>
                    <p>{campaigns.find((c) => c.id === p.campaign_id)?.name}</p>
                  </div>
                  <small>
                    {new Date(p.registered_at).toLocaleDateString()}
                  </small>
                </div>
              ))
            ) : (
              <p className="muted">
                Your community’s first registrations will appear here.
              </p>
            )}
          </section>
        </>
      )}
      {view === "campaigns" && (
        <>
          <div className="toolbar">
            <input
              className="search-input"
              aria-label="Search campaigns"
              placeholder="Search campaigns…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label="Campaign status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {["draft", "published", "ended", "archived"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <CampaignTable
            campaigns={campaigns.filter(
              (c) =>
                c.name.toLowerCase().includes(query.toLowerCase()) &&
                (!status || c.status === status),
            )}
            participants={participants}
          />
        </>
      )}
      {view === "submissions" && (
        <Participants participants={participants} campaigns={campaigns} />
      )}{" "}
      {view === "analytics" && <Analytics {...props} />}{" "}
      {view === "overview" && campaign && (
        <Overview
          campaign={campaign}
          participants={participants}
          events={events}
        />
      )}{" "}
      {view === "settings" && (
        <div className="panel">
          <Settings size={26} color="#155eef" />
          <h2 style={{ marginTop: 20 }}>Framezi · An Infonits product</h2>
          <p>
            Administrator accounts are managed in Supabase. Public sign-up is
            disabled in this application.
          </p>
          <hr
            style={{
              border: 0,
              borderTop: "1px solid #e7eaf0",
              margin: "24px 0",
            }}
          />
          <h3>Privacy by design</h3>
          <p>
            Registration metadata and campaign activity are stored in your
            database. Original photographs, generated images, and face data are
            never stored.
          </p>
          <h3 style={{ marginTop: 24 }}>Campaign preferences</h3>
          <p>
            Set branding, participant requirements, downloads, and sharing
            individually in each campaign’s editor.
          </p>
          <Link href="/privacy" className="text-link" style={{ marginTop: 20 }}>
            View privacy policy <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
    </main>
  );
}
