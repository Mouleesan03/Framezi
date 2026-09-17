# Framezi verification record

## Completed

- Next.js 16.3.5 production build (webpack): passed.
- TypeScript strict checking: passed.
- Eight automated tests: passed, including an actual PostgreSQL engine (PGlite).
- Migration and development seed execute successfully against stub Supabase auth/storage schemas.
- Anonymous participant reads blocked; non-admin authenticated users see no participant records.
- Public direct registration RPC execution denied; service-role registration succeeds.
- Case-insensitive duplicate email rejection when configured, administrator campaign save/update, and unpublished campaign isolation verified.
- Generated-event deduplication, download timestamp updates, invalid participant rejection, and database limiter verified.
- Metadata schemas reject image/extra fields, invalid email, missing consent, invalid campaign dates, unsafe asset URLs, and reserved slugs.
- CSV escaping/formula protection verified.
- Browser demo flow: details → consent → local JPEG selection → rotation/reset → frame selection → 2160 × 2160 generated Blob image → Create Another clears details and image state.
- PNG and JPG controls exercised; the in-app browser's download-event interception timed out, so filesystem download completion is not claimed.
- Responsive campaign checks at observed 360, 375, 390, 393, 414, 430 and 1024 px had no horizontal overflow. A 390 px screenshot was visually inspected. Larger desktop layout was visually inspected.
- Public landing and campaign layouts inspected in the in-app Chromium browser.
- Privacy audit of all fetch, FormData, upload, photo, Blob, and base64 references: visitor transport contains only explicit registration/event metadata. Admin asset upload is authenticated and isolated. No image browser-persistence calls or photo database columns.
- Built-in overlays are 2160 × 2160 transparent PNGs. Source SVGs are retained for editing placeholder assets.

## Must be verified with the deployment

- Live Supabase Auth login/session refresh/logout and disabled public registration.
- Supabase Storage policies and real administrator frame uploads.
- Live registration, signed participant cookies, cross-origin rejection, analytics, and full admin create → publish → visitor → CSV flow.
- Safari desktop/iPhone, Chrome Android, and Edge desktop on actual devices. No cross-browser pass is claimed.
- Native file sharing and fallback behavior on actual supported devices; Facebook link behavior without posting content.
- Native HEIC decoding/EXIF orientation on iPhone samples, very tall/landscape/square/large 10 MB images, and low-memory devices.
- QR PNG download and scanning after the production domain is configured.
- Expected load, shared-network rate limits, large campaign analytics/CSV scaling, and Core Web Vitals.
- Review retention, organizer contact details, legal copy, actual branding assets, and domain settings.

## Known scope boundaries

- Supabase and Vercel credentials were not supplied. No hosted project was created or production data stored.
- The manifest is provided, but there is no offline service worker. New campaign loads and live registration require connectivity.
- Face centring is optional and browser-native with centre fallback. MediaPipe is not bundled.
- Admin analytics load metadata into the administrator browser. Move aggregation/search/export to paginated SQL/server endpoints for high-volume use.
- No emails, visitor image uploads, session replay, or third-party advertising trackers are implemented.
- Development hot reload produced an instrumentation-related root-attribute hydration warning (`data-qb-installed`) from the in-app browser, and an effect-dependency warning while source was being changed. These are recorded separately from final production verification.
