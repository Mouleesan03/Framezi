# Framezi

**Create. Frame. Celebrate.** An Infonits product.

A Next.js 16 / React / TypeScript / Tailwind application with Supabase PostgreSQL, admin authentication, campaign management, registration metadata, analytics, and a browser-only Canvas photo editor.

## Run locally

Requires Node.js 22 or later.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 (or the port printed by Next.js). Without Supabase credentials, the University of Jaffna demo works locally and explicitly does **not** save participant details. Administrator pages stay protected; there is no fake admin bypass.

- `/`: landing page
- `/uoj-convocation-2026`: seeded public demo
- `/c/uoj41`: short link for the seeded public demo
- `/admin`: administrator sign-in
- `/admin/dashboard`, `/admin/campaigns`, `/admin/campaigns/new`
- `/admin/campaigns/[id]`, `/edit`, `/analytics`
- `/admin/submissions`, `/admin/analytics`, `/admin/settings`
- `/privacy`, `/terms`

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_framezi.sql`, then `supabase/migrations/002_public_campaign_stats.sql`, in the SQL editor. They create the tables, indexes, RLS, guarded RPCs, short links, download-based public usage counts, and the public `campaign-assets` bucket.
3. For development, run `supabase/seed.sql`. The demo uses the three supplied University of Jaffna convocation frames; future campaigns can upload transparent square PNG overlays.
4. Under Authentication settings, **disable public sign-ups**. The application has no registration UI, but the project-level switch must also be disabled.
5. Create your first user manually in Authentication → Users. Set its email and password and confirm the email.
6. Create the matching administrator profile in the SQL editor, replacing the example UUID and email:

```sql
insert into public.profiles (id, email, full_name, role)
values ('YOUR-AUTH-USER-UUID', 'admin@your-domain.example', 'Campaign Admin', 'admin');
```

Only users with an administrator profile can enter the dashboard or mutate campaigns. Profiles cannot be self-created through the public client.

### Environment variables

Use `.env.local` for local development and Vercel project settings for hosted environments:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVER-ONLY-SERVICE-ROLE-KEY
NEXT_PUBLIC_SITE_URL=https://framezi.app
RATE_LIMIT_SECRET=YOUR-RANDOM-32-CHARACTER-OR-LONGER-SECRET
```

Never prefix the service-role key with `NEXT_PUBLIC_`. Its access is restricted to `server-only` modules. Never commit `.env.local`. The service key is used only for tightly validated public registration/events and the database-backed limiter. Admin operations use the authenticated user's RLS context.

### Database design

- `profiles`: administrator role and identity
- `campaigns`: branding, lifecycle, dates, participant and sharing configuration
- `campaign_frames`: admin-owned overlays
- `participants`: name, email, participation/marketing consent and activity timestamps
- `campaign_events`: allowlisted events with generation IDs for deduplication
- `rate_limits`: temporary HMAC keys and request counters, no raw IP addresses

Public users can read published/ended campaigns and enabled frames. Public inserts happen through rate-limited same-origin server endpoints, not unrestricted PostgREST insert policies. No public participant reads are allowed. SQL functions are explicitly revoked from anonymous/authenticated roles where service-only execution is needed. Participant event writes require a signed, HTTP-only, one-day cookie tied to the campaign and participant. The server checks small JSON bodies against strict schemas that reject extra keys.

The duplicate-email check runs with a campaign row lock. Counted activity is deduplicated by participant, event type, and generation UUID. The public “people joined” figure counts distinct participants who completed a PNG or JPG download. Share counts represent completed native shares and Facebook-button clicks, not confirmed Facebook publications. Views represent page visits, not unique people.

## Create a campaign

Sign in at `/admin`. Select **Create Campaign** and work through:

1. Campaign name, slug, organization, title, dates, and description.
2. Logo, cover image, colors, and messages.
3. Up to three square transparent PNG overlays. Recommended 2160 × 2160, maximum 4 MB per campaign asset. The editor validates square dimensions and transparency.
4. Required name/email, duplicate-email policy, name rendering, and optional face centring.
5. Sharing, PNG/JPG formats, filenames, and thank-you message.
6. Preview and publish.

Published campaigns have a public link, customizable share caption and thumbnail, a compact `/c/{code}` link, and downloadable QR code. Campaigns can be edited, unpublished, duplicated, archived, ended, or permanently deleted. Deleting a campaign cascades to participant and event records. Uploaded bucket assets are retained: use Supabase storage administration to remove assets after checking they are not used by duplicated campaigns.

The admin overview and analytics use real database records. The submissions table offers search, campaign/date filters, pagination, and CSV export. CSV cells are escaped and formula prefixes neutralized. Analytics dates are grouped in UTC; Today uses the administrator browser's local day.

## Photo privacy architecture

The visitor file input is never placed in a submitted form. `loadImageFromFile()` decodes the selected file with `createImageBitmap`, applies EXIF orientation using the browser decoder, and downsizes the longest edge to 4096 pixels. The normalized photo exists only as an in-memory Blob URL.

`react-easy-crop` supplies crop coordinates and rotation. Canvas renders the rotated crop, then the admin frame, then an optional participant name with automatic text fitting. The frame-selection preview uses the same renderer as the final export. Results default to 2160 × 2160; 1080 is also supported. PNG and white-backed JPG (quality 0.95) are created using `canvas.toBlob()`.

No visitor image bytes, filenames, EXIF, hashes, dimensions, face landmarks, or Blob URLs are included in registration or analytics requests. No image goes to Supabase, Vercel, an image host, browser persistence, analytics, or remote cache. Blob URLs are revoked when replaced/unmounted. Create Another clears participant and image state. Downloads save to the user's device. Explicit native sharing hands the chosen file to the user's chosen app; Facebook receives only the campaign URL.

Only the separate, authenticated **admin asset** endpoint uploads images, and only to the campaign assets bucket. The visitor editor never calls it. Sample portraits and overlays are public project assets, not visitor images.

### Offline editing and format support

Campaign frame assets preload before registration can continue. Once the cropper and assets load, editing, generation and download do not require a server connection. Failed analytics does not block processing. Loading a new campaign or live registration still requires connectivity. This is not a fully offline PWA; a manifest is supplied without a service worker, so no visitor photos can be cached by a worker.

JPEG, PNG, and WEBP are supported. HEIC/HEIF is decoded only when the browser supports it; otherwise a clear JPG/PNG/WEBP fallback message appears. Optional face centring uses the browser's on-device `FaceDetector` when available and falls back to normal centring. It is feature-dependent, not a guaranteed MediaPipe implementation. No detector output is saved.

## Branding and more frames

Edit `src/config/brand.ts` for product identity and the canonical privacy notice. Global brand colors and visual styles live in `src/app/globals.css`. Public campaign colors come from their database records. The campaign template has intentionally subtle Framezi attribution.

To support more than three frames, change `MAX_FRAMES`, the `campaignSchema` array maximum, and the `save_campaign` RPC's frame-limit validation together. The frame relationship is already one-to-many. Use a horizontal selector or grid appropriate to the new maximum.

## Build and verification

```sh
npm run typecheck
npm test
npm run build
npm start
```

The build uses Next's supported webpack builder because the local sandbox denied a Turbopack worker's port binding. The development server uses Turbopack normally.

Tests run real PostgreSQL semantics via PGlite with stub Supabase auth/storage schemas. They check migration execution, RLS isolation, administrator save, duplicate-email rules, generation deduplication, rate limiting, strict metadata validation, safe CSV, and campaign dates. This does not replace verification against your hosted Supabase project.

See `QA.md` for completed checks and deployment-dependent work. No production-readiness claim should be made before live auth/storage/RLS integration, load limits, domain settings, and target-device testing are completed.

## Vercel deployment

1. Push this project to your repository and import it into Vercel as a Next.js project.
2. Set the environment variables above for Preview and Production as appropriate. Use separate development/production Supabase projects where possible.
3. Run the migration and seed only where intended. Create the administrator and disable public sign-up.
4. Build command: `npm run build`. Do not configure a static output export: the application requires a Next.js server runtime.
5. Configure Supabase Site URL and allowed redirect URLs for the actual deployed domain.
6. Deploy and test administrator login, asset upload, published registration, analytics, and database policies using non-sensitive test records.
7. In Vercel → Project → Settings → Domains, add your chosen domain. Apply the DNS records Vercel supplies. Set `NEXT_PUBLIC_SITE_URL` and Supabase settings to match and redeploy.

A hosted project was not provisioned by this build. You must supply your Supabase/Vercel accounts and environment values. Never paste the service-role key into a campaign form or public client code.

### Security and operational notes

Security headers deny framing, restrict resource origins, and prevent MIME sniffing. The baseline CSP permits Next's inline bootstrap and inline styles; `unsafe-eval` is development-only. For a stricter policy, adopt per-request nonces and dynamic rendering. Do not add session replay, third-party image upload SDKs, or analytics that inspect DOM image contents.

The database limiter uses short-lived HMACs of the deployment's forwarded address and an hourly window: 30 registration attempts, 20 login attempts, 500 activity events per address/hour. Tune limits for shared university networks and add Vercel Firewall rules for large public launches. Forwarded headers must come from your trusted proxy; do not expose a self-hosted origin behind untrusted forwarding headers.

The first version loads administrator metadata for client-side charts and exports. For very large campaigns, move aggregation and paginated searches to SQL and stream CSV exports. Plan retention and authorized access to exported registration records. Review the supplied generic privacy and terms copy for your actual organization and jurisdiction.

## Demo assets

The three University of Jaffna campaign frames were supplied for this project. The sample Sri Lankan graduate portrait is an AI-generated demonstration asset and does not depict a real participant. Replace campaign artwork only with assets you are authorized to publish.
