<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# موعد الحلقة (Mawid)

An Arabic-first site with countdowns to the next episode of every currently airing anime, plus links to the official, legal streaming services. It's a portfolio project, so code should be clean and easy to explain.

Stack: Next.js 16 App Router (`cacheComponents: true`), React 19, TypeScript, Tailwind CSS v4, `@anthropic-ai/sdk` (optional synopsis translation).

## Pages

- `/`: picks the layout by screen width with CSS (`SchedulePage view="auto"`): **tickets** on phones, **posters** from the `md` breakpoint up. Both card styles are server-rendered and the hidden one is `display:none` (its lazy images never load), so there is no layout flash.
- `/posters`: always **posters**. A full-width hero shows the next episode over its banner art with a big red countdown, followed by a grid of tall poster cards. Canonical URL `/`.
- `/tickets`: always **tickets**. Each episode is a cinema ticket whose perforated stub holds the time and countdown. Canonical URL `/`.
- `/anime/[slug]`: a **show page** per show (`showPath()`: readable slug + AniList media ID, e.g. `/anime/black-clover-season-2-195604`). Hero with art, Arabic + English titles, countdown, favourite and reminder buttons; the story; platform logos; TVSeries JSON-LD and per-show metadata. Shows airing this week are prerendered from the cached schedule (no extra AniList requests); other IDs are fetched on first visit and cached; outdated slugs redirect; unknown IDs 404.
- `/my-list`: **قائمتي**, the visitor's favourite shows with their next episode. Not indexed.
- Clicking a card, or "التفاصيل والقصة" in a hero, opens a **details popup**: art, Arabic title, genres, episode info, the synopsis with its official source, platform logos, favourite and reminder buttons, and a link to the show page. Card links are real `<a href>`s to the show page (crawlable; Ctrl/middle-click opens the page), and a plain click opens the popup instead.

## Structure

```
app/
  layout.tsx        <html lang="ar" dir="rtl">, fonts, all SEO metadata + viewport
  page.tsx          Auto layout (tickets on phones, posters on larger screens) + WebSite JSON-LD
  posters/page.tsx  Posters layout
  tickets/page.tsx  Tickets layout
  my-list/page.tsx  Favourites page
  anime/[slug]/page.tsx  Show pages: generateStaticParams, generateMetadata, slug redirect
  globals.css       Dark-only theme tokens, glow and ticket utilities, exposed to Tailwind with @theme
  error.tsx         Arabic error screen with retry (shown when AniList fails)
  robots.ts, sitemap.ts, manifest.ts
  icon.svg, favicon.ico, apple-icon.png, opengraph-image.png (+ .alt.txt)   Static metadata files
lib/
  site.ts           Site name, URL, SEO title/description/keywords, default time zone
  anilist.ts        AniList GraphQL query, pagination, normalization, synopsis cleanup + localization, caching
  translate.ts      Claude translation of official synopses to Arabic (opt-in, cached per text)
  types.ts          Episode (full, server), EpisodeSummary (sent to the client), Synopsis, FavoriteShow
  schedule.ts       toSummary, matchesFilters (the one filter rule), genre/platform option lists
  genres.ts         AniList genre → Arabic lookup; Ecchi is flagged as mature (red)
  platforms.ts      Platform → brand colour + logo path (Simple Icons, CC0) or wordmark; generated logo data
  format.ts         Arabic counting rules, countdown/clock text, Intl formatters, local day keys
data/
  titles-ar.ts      Arabic show names fans actually use (only established names; others left out)
  descriptions.ts   Hand-written Arabic synopses keyed by AniList media ID; these override everything
  synopses-ar.ts    Prepared Arabic synopses (adapted from AniList's English text) for the October 2026 shows
hooks/
  useNow.ts         One shared 1-second ticker (useSyncExternalStore); useClock(selector), useToday()
  useHydrated.ts    false on server/hydration, true afterwards
  useLocalStorage.ts  JSON value in localStorage, hydration-safe, syncs across hooks and tabs
  useFavorites.ts   Favourite shows (localStorage "mawid.favorites"), usable anywhere without a provider
  useRevealed.ts    Which mature shows the visitor chose to see, for this visit (shared across the page)
components/
  Header.tsx, Footer.tsx            Server
  SiteNav.tsx                       Client: ملصقات / تذاكر / ★ قائمتي (with count); on / it highlights the layout the screen shows
  Toolbar.tsx                       Client: search, genre and platform filters
  PlatformLogos.tsx                 Brand logo tiles linking to official streaming pages
  Mascot.tsx                        The mascot (5 poses) as a decorative next/image
  MascotFace.tsx                    Client: round mascot face beside the logo that watches the cursor
  FavoriteToast.tsx                 Client: "أُضيف إلى قائمتي!" pop-up with the celebrating mascot
  schedule/SchedulePage.tsx         Server: shared page for both layouts; renders every card + its details
  schedule/ScheduleProvider.tsx     Client context: filters, selected day, visibleIds, nextId, open popup
  schedule/EpisodeSlot.tsx          Client: shows/hides a server-rendered card; renders its popup when open
  schedule/DetailsDialog.tsx        Client: native modal <dialog> (Escape, backdrop click, ✕)
  schedule/DetailsHost.tsx          Client: the single popup, built in the browser for the open episode
  show/ShowPage.tsx                 Server: the show page layout
  schedule/PosterHero.tsx, TicketHero.tsx, CountdownBoxes.tsx   Client: the two heroes and their countdown
  schedule/DayTabs.tsx, GridStatus.tsx                          Client: day pills, empty state
  card/PosterCard.tsx, TicketCard.tsx, GenreTags.tsx, SeasonProgress.tsx   Server
  card/OpenDetails.tsx, FavoriteButton.tsx, MatureCover.tsx, ReminderButton.tsx   Client
  card/ShowDetails.tsx, SynopsisBlock.tsx                       Plain components shared by the popup (browser) and the show page (server)
  favorites/FavoritesList.tsx       Client: the قائمتي list
  time/Countdown.tsx, LocalTime.tsx, TimeZoneNote.tsx           Client
  time/CompactCountdown.tsx, AiringProgress.tsx                 Client: ticket stub countdown (08س 40د 12ث) and progress line
reference/
  prototype.html, designs/          Early HTML prototype and design mockups (not part of the app)
  mascot/                           Original mascot art (white background) + cutout.cjs (regenerates the pose WebPs)
  mascot/look/                      The owner's look-direction sheets (9×9 in use, older 5×5 kept) + build-look.cjs (regenerates look.webp and look-center.webp)
```

## Rules

**Data**
- AniList (`https://graphql.anilist.co`) is fetched **only on the server**, in `lib/anilist.ts`. Never fetch it from the browser.
- AniList rate-limits (HTTP 429). `anilist()` retries 429/5xx up to 4 times, honouring `Retry-After`. `next.config.ts` sets `experimental.staticGenerationMinPagesPerWorker: 1000` so the build uses one worker: each worker has its own in-memory cache, and with ~15 workers a build made 21 AniList requests instead of 6 and could fail on 429.
- Caching uses `'use cache'` + `cacheLife({ revalidate: 1800 })` (30 minutes). Under `cacheComponents`, do not use `fetch(..., { next: { revalidate } })` or `export const revalidate`.
- The schedule covers one hour ago through 7 days ahead, every page, with `isAdult` titles skipped. Only `STREAMING` external links are kept, one per site.
- Cover and banner images go through `next/image` (`s4.anilist.co` is allowed in `next.config.ts`). The AniList cover colour is the background while loading.
- **Synopses**, in order of preference:
  1. The owner's hand-written Arabic in `data/descriptions.ts`. Don't generate these.
  2. The prepared Arabic synopses in `data/synopses-ar.ts`. When new shows appear, add entries there in the same style: a clear Arabic story pitch, names as Arab fans write them, no notes or credits, no invented facts. For bare "second season of X" texts, a short premise is fine only when it is certain.
  3. A Claude translation of AniList's official English synopsis. This runs only when `ANTHROPIC_API_KEY` is set on the server, and each text is cached with `cacheLife("max")`.
  4. The English text, with an Arabic note saying the Arabic version is in preparation.
- The translation prompt (`lib/translate.ts`) asks for a short, clear Arabic story pitch in the style of official Arabic synopses on streaming services, not a literal translation. Never copy synopses from streaming sites; their Arabic text is copyrighted.
- `cleanDescription` strips AniList's HTML and trailing "Note:" sections, and pulls the "(Source: …)" credit out from anywhere in the text. The credit is always shown as "المصدر: …".
- A failed translation falls back to English and isn't cached, so it's retried on the next refresh.

**Server vs client**
- Default to server components. Only use a client component when the UI depends on something the server can't know: the visitor's time zone, the current time, localStorage, or interaction.
- Every card for the week is rendered on the server in `SchedulePage` and passed to `EpisodeSlot` as `children` (stays a server component); `EpisodeSlot` only toggles `hidden`.
- The details popup is **not** pre-rendered per card: `DetailsHost` builds it in the browser for the open episode from the `Episode` data the provider already has (synopsis and Arabic title included). This keeps pages light; don't reintroduce per-card server-rendered details.
- Card cover images use fixed `width`/`height` (not `fill` + `sizes`), so Next.js emits a 1x/2x srcset instead of 8 widths. Keep it that way for anything repeated per card.
- Don't close a native <dialog> in an effect cleanup: React's development Strict Mode runs effects twice, and the `close` event would immediately unmount the popup.
- Things derived from the clock that change rarely (the next episode, the favourites cutoff) use `useClock(selector)` with a primitive result, so they re-render only when the value changes.
- Time-zone handling: the server render and hydration use `SITE.defaultTimeZone` (Asia/Riyadh) and the schedule's `generatedAt` as "now", so crawlers see real, visible content. After hydration, `timeZone` switches to the visitor's own.
  - Read the zone from `useSchedule().timeZone` and pass it to the `format*` helpers.
  - Never call `Date.now()` during render.
- All countdowns share the single ticker in `hooks/useNow.ts`. Don't add per-component intervals.
- Search also matches Arabic titles.
- Filtering (search, genre, platform) goes through `matchesFilters` in `lib/schedule.ts`, so cards, tab counts, the hero and the empty state always agree.
- Show pages read data with `getShow(mediaId)`: from the cached schedule when the show airs this week, otherwise one cached AniList `Media` query. Build show URLs only with `showPath()`; `mediaIdFromSlug()` reads the ID back.
- Reminders (`ReminderButton`) are client-only: a prefilled Google Calendar link and a downloadable .ics (UTC times, 10-minute alert). No server or accounts.
- Favourites are stored as `FavoriteShow` objects (media ID, title, cover, colour), so `/my-list` can list shows even when they aren't airing this week. Use `useFavorites()`; don't read the key directly.

**Mature content**
- AniList `isAdult` titles are excluded entirely. Shows with mature content keep their artwork blurred behind a warning and a red "عرض" button until the visitor reveals it.
- Mature content is decided on the server in `isMatureContent` (`lib/genres.ts`) and stored as `Episode.mature`: the Ecchi genre, or an AniList tag flagged `isAdult` (or "Nudity") with rank ≥ 40.
- Clicking anywhere on a blurred cover reveals it; the overlay sits above the card's open-details button, so the first click never opens the popup.
- Wrap every artwork `<Image>` in `<MatureCover>`: `lg` for posters and the popup, `sm` for thumbnails, `bg` for decorative backgrounds (no button). Revealing a show unblurs it everywhere on the page until reload.
- Favourites store a `mature` flag (built with `favoriteOf()`), so `/my-list` can blur them too.

**Language and formatting**
- Full RTL Arabic UI. Latin titles in poster/romaji contexts are `dir="ltr"` with `text-right`.
- All numbers use Western digits. Use `LOCALE = "ar-u-nu-latn"` from `lib/format.ts` for every `Intl` formatter.
- Arabic counting rules (`countWithUnit` / `unitNoun`): 1 → ساعة, 2 → ساعتين, 3–10 → "5 ساعات", 11+ → "11 ساعة". The same rules apply to days, hours, minutes, seconds, episodes (حلقة) and shows (عمل).
- Times are shown in the visitor's own time zone.

**Styling**
- **Posters** is the main design and **tickets** the alternative. Both share the hero countdown style: four clearly separated groups, never one run-together number.
- Colour theme: **dark-only**, mostly black with white type. Signals are small and sharp:
  - **Glowing red** (`signal`): the brand word, next-up labels, countdown digits, the selected day and nav item, "airing within the hour", favourite stars, mature genres.
  - **Green** (`accent`): on air now, season progress, and platforms without a known brand.
  - Keep red and green to small details; don't fill large areas with them. Corners are small (`rounded-md`/`rounded-lg`).
- Platforms are shown **only as logos** (`PlatformLogos`), each in its brand colour from `lib/platforms.ts`. Brands without a Simple Icons logo get a short wordmark. Add new AniList site names there; regenerate the logo paths rather than hand-editing them.
- Use Tailwind with the theme tokens from `globals.css`: `bg-background`, `bg-surface`, `text-ink`, `text-muted`, `border-line`, `text-signal`, `text-accent`, `bg-chip`, `bg-banner`. Don't hard-code hex colours in components. Per-show cover colours come from data, as inline styles.
- Poster cards: the favourite star sits beside the title (not over the art) and glows red when active.
- Ticket stubs: time, weekday, a numbers-only countdown (س / د / ث, plus ي beyond a day), and the airing progress line. The line fills across the week, stays dark green (`accent-deep`) beyond 24 hours, brightens toward `accent` through the last day, and glows bright green once on air. Keep stubs free of extra words.
- Custom utilities in `globals.css`: `glow-signal`, `glow-accent`, `glow-box-signal`, `ticket-stub`, `ticket-stub-hero`.
- Fonts:
  - `font-display` (Reem Kufi) for Arabic headings.
  - `font-poster` (Anton) for poster titles and countdown digits.
  - `font-sans` (IBM Plex Sans Arabic) for body text.
  - `font-mono` (IBM Plex Mono) for times.
- The footer must credit AniList as the data source.

**Mascot**
- Five poses in `public/mascot/` (transparent WebP, cut out of the originals in `reference/mascot/` with `node reference/mascot/cutout.cjs`). Use `<Mascot pose=... height=... />`; it's decorative (`alt=""`), so the text beside it must carry the message.
- Where each pose is used: `celebrate` = the add-to-list pop-up (fired from `useFavorites` via `FAVORITE_ADDED_EVENT`); `fix` = `app/error.tsx`; `confused` = no search results and `app/not-found.tsx`; `sleepy` = a day with no episodes and a show page with no announced episode; `cool` = empty قائمتي.
- Keep it to these few moments; don't scatter the mascot across regular UI.
- The header logo has `MascotFace`: a round badge showing the mascot's head from the owner's **9×9 sheet of 81 drawn look directions** (row = up→down, column = left→right from the viewer; sprite `public/mascot/look.webp`, ~220 KB). A point on that grid eases toward the cursor's direction (85ms, frame-rate independent) and the face shows the **single nearest drawn frame**, crossfading 70ms between consecutive frames (a flipbook, so never a blended double image; blending 4 frames caused ghosting and was removed). It settles on whole frames with hysteresis, and the head drifts 1–3px continuously with the cursor; a slow `breathe` keyframe adds idle motion. The full-turn distance is measured per direction from the room to the screen edge (the face sits in a top corner). On touch it follows the finger and re-centres after 2.5s; it stays still with reduced motion. A 5 KB `look-center.webp` shows first and the sprite loads on the first pointer event; the DOM is updated directly, with no React re-renders. `GRID` in `MascotFace.tsx` must match `build-look.cjs`; regenerate with `node reference/mascot/look/build-look.cjs` (it slices the sheet, cuts at minimum-ink lines, removes the background, aligns on the shoulders, and fixes rows clipped by the sheet edge).

**SEO (target: Arabic-speaking countries)**
- All SEO copy lives in `lib/site.ts`. The site URL comes from `NEXT_PUBLIC_SITE_URL`, falling back to Vercel's production URL. Search-console codes come from `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION`.
- Keep content visible in the server HTML. Don't hide content behind client-only rendering.
- Heading order: one sr-only `h1` per schedule page (visible "قائمتي" on `/my-list`), then `h2` for sections and the hero title, then `h3` for cards.
- `/posters` and `/tickets` are canonical to `/`; `/my-list` is `noindex`. The sitemap lists `/` plus every show page airing this week. Show pages have a visible `h1` (Arabic name when known) and their own title/description/OG image.
- The OG image and icons are static files rendered from HTML with headless Edge. `next/og` doesn't shape Arabic text reliably, so if they change, regenerate them the same way.

**Deployment**
- Live at **https://www.mawidanime.com**, hosted on Vercel (Hobby plan), deployed automatically from the `main` branch of github.com/Gutsing-Around/mawid. Every push to `main` goes live; roll back from Vercel → Deployments → Promote.
- The domain was bought on Vercel (auto-renew on) and uses Vercel DNS. `www` is the primary address; `mawidanime.com` redirects to it with a 308.
- Google Search Console is verified with a DNS TXT record in Vercel → Domains → mawidanime.com. Don't delete it.
- Vercel production env: `NEXT_PUBLIC_SITE_URL=https://www.mawidanime.com` (type Config). Env changes need a redeploy.

**Analytics**
- Vercel Web Analytics and Speed Insights (`@vercel/analytics`, `@vercel/speed-insights`) are mounted in `app/layout.tsx`; both are cookie-free. They must also be enabled in the Vercel dashboard.

**Environment variables**
- `NEXT_PUBLIC_SITE_URL`: the production URL.
- `ANTHROPIC_API_KEY`: enables Arabic synopsis translation (optional).
- `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`: search-console verification codes (optional).

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Ignore routine debugging and unverified changes. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Keep a qualifying candidate through the reporting pass even if you resolve or work around it. A successful fix changes the report outcome; it does not erase the friction that qualified it.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `node node_modules/next/dist/bin/next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
