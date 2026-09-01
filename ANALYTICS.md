# GOAT PDF — Google Analytics 4

This documents the GA4 implementation added on top of GOAT PDF's existing, separate internal analytics system (see README.md's "Analytics" section for that one — it's unrelated, self-hosted, and stays as-is). The two systems are independent: GA4 is Google's own product, configured with `NEXT_PUBLIC_GA_MEASUREMENT_ID`; the internal system is configured with `ANALYTICS_ENABLED`/`ANALYTICS_ENDPOINT_URL`. Either, both, or neither can be on at once.

## How it's wired up

- **`NEXT_PUBLIC_GA_MEASUREMENT_ID`** (e.g. `G-XXXXXXX...`) is the only thing that turns GA4 on. Unset, GA4 is completely off: no script tag is rendered, no request to Google is ever made, and every event-tracking call in the app becomes a no-op. The app behaves identically either way — this is a pure addition, not a feature the rest of the app depends on.
- Uses **`@next/third-parties/google`**'s `<GoogleAnalytics gaId={...} />` component — Next.js's own documented, recommended way to load `gtag.js` in an App Router app (see [Next.js's third-party libraries guide](https://nextjs.org/docs/app/guides/third-party-libraries)). It's mounted once in the root layout (`src/app/layout.tsx`), conditionally, only when the Measurement ID is set.
- Custom events are sent via that same package's `sendGAEvent()` helper, wrapped in `src/lib/analytics/ga.ts` — the single place every GA4 call in the app goes through.
- **Content-Security-Policy**: `next.config.ts`'s CSP is otherwise fully self-contained (no external origins at all). It now conditionally adds exactly the origins GA4's `gtag.js` needs (`googletagmanager.com` for the script, `google-analytics.com`/`googletagmanager.com` for the beacon/collect calls) — and only when a Measurement ID is actually configured, so an unconfigured deployment keeps the original, fully locked-down policy verbatim.

## Basic tracking

**Page views and client-side navigation** are handled automatically by GA4 itself — no code fires them. GA4's Enhanced Measurement feature listens for browser history changes, which is exactly how Next.js's App Router navigates between pages, so every client-side route change is picked up without any manual event. This is Google's and Next.js's documented recommendation; manually sending a `page_view` on top of this would double-count every view; see the comment in `layout.tsx`.

This does depend on one thing in your GA4 property, on by default for new properties but worth confirming: **Admin → Data Streams → your web stream → Enhanced measurement → "Page changes based on browser history events"** must be checked. See "Verify Analytics" below.

**Tool page views** are a GOAT-PDF-specific concept GA4 doesn't know about on its own, so they're sent explicitly as the `tool_view` custom event (below), fired from `src/components/analytics/AnalyticsPageView.tsx` — the same component that already detects a `/tools/<slug>` route change for the app's internal analytics.

## Custom events

All six are implemented, matching the required names exactly. Every event's parameters are listed below — nothing beyond what's listed here is ever sent.

| Event | Fired from | Parameters |
|---|---|---|
| `tool_view` | `AnalyticsPageView.tsx`, on navigating to `/tools/<slug>` | `tool_name` |
| `file_upload` | `UploadZone.tsx`, once per successful add-files action | `tool_name`, `file_count` |
| `processing_started` | Each tool component, right before the processing request is sent | `tool_name`, `file_count` |
| `processing_completed` | Each tool component, on a successful response | `tool_name`, `success: true` |
| `processing_failed` | Each tool component, on a validation/server error *or* a network failure | `tool_name`, `success: false` |
| `file_download` | `downloadFile.ts` (shared by all 8 tools' success state), after a download is actually triggered | `tool_name` |

`tool_name` always uses the app's real tool identifiers — the same slugs used in routing and the internal analytics system: `compress-pdf`, `merge-pdf`, `split-pdf`, `rotate-pdf`, `delete-pdf-pages`, `jpg-to-pdf`, `pdf-to-jpg`, `pdf-to-word`.

`file_count` reflects how many files were actually involved (e.g. 2–20 for a Merge PDF batch, 1 for single-file tools like Compress or Rotate).

`success` is included per the task's request even though `processing_completed`/`processing_failed` are already distinct event names — it makes each event self-describing when segmenting by parameter in GA4's Explore reports, without needing to infer the outcome from the event name alone.

## What is never sent

Per the explicit requirement, none of the following are ever included in any GA4 event, anywhere in this implementation:

- PDF contents or any extracted document text
- Document metadata
- Filenames (the actual file the user uploaded, or the generated output file)
- Personal information of any kind
- Uploaded file URLs or generated download URLs
- Any IP address (GA4 handles its own IP-based geolocation at Google's edge, independent of this app; this app does not read or forward the visitor's IP to GA4 itself)

This is enforced structurally, not just by convention: `GaEventParams` in `src/lib/analytics/ga.ts` is a closed TypeScript interface with exactly three optional fields — `tool_name`, `success`, `file_count` — the same pattern already used by this app's internal `AnalyticsEvent`/`JobLogEvent` types. There is no field a call site could use to pass a filename or URL even by mistake; doing so would be a type error.

## Environment handling

| Variable | Required | Behavior |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Unset (default): GA4 is fully disabled — no script, no requests, all tracking calls are no-ops. Set to a real `G-XXXXXXX...` ID: GA4 is active. |

Because this is a `NEXT_PUBLIC_*` variable, it's inlined into the client JavaScript bundle **at build time**, not read at request/runtime — it must be set before `next build` runs. For a Docker deployment (this app's actual deployment path — see DEPLOYMENT.md), that means it needs to reach `docker build` as a `--build-arg`, which the Dockerfile now declares (`ARG NEXT_PUBLIC_GA_MEASUREMENT_ID` / `ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID`), the same pattern already used for `NEXT_PUBLIC_SITE_URL`.

See `.env.example` for local development and README.md for where to find your Measurement ID and how to set this on Render.

## Verify Analytics

1. **Confirm the script loads.** With `NEXT_PUBLIC_GA_MEASUREMENT_ID` set and the app running, open any page and view the page source (or DevTools → Network) — you should see a request to `https://www.googletagmanager.com/gtag/js?id=G-...`. With the variable unset, this request should not exist at all.
2. **Use GA4's Realtime report.** In the GA4 property, go to **Reports → Realtime**. Browse the live site in another tab — you should see yourself as an active user within a few seconds.
3. **Check page views and navigation.** Still in Realtime, click between the homepage and a couple of tool pages. Each should register as a page view without a full page reload (confirms Enhanced Measurement's browser-history tracking is working).
4. **Check custom events.** In Realtime, use the "Event count by Event name" card (or DebugView — see below) and: view a tool page (`tool_view`), add a file (`file_upload`), run the tool (`processing_started` then `processing_completed`), and download the result (`file_download`). Try an invalid file to see `processing_failed`.
5. **Inspect event parameters precisely with DebugView.** Install the [Google Analytics Debugger Chrome extension](https://chrome.google.com/webstore) (or add `?gtm_debug=1`... actually for gtag.js, enable debug mode via the extension) and open **Admin → DebugView** in GA4 — this shows each event with its exact parameters (`tool_name`, `file_count`, `success`) as they arrive, which is the most reliable way to confirm no unexpected data is being sent.
6. **Standard reports take longer.** Realtime/DebugView reflect activity within seconds; GA4's regular reports (Engagement → Events, etc.) can take several hours to populate.
