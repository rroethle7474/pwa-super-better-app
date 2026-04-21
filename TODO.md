# TODO

Project work tracker. Items grouped by priority: existing bugs, pre-deploy gates (security + robustness), deploy itself, then post-deploy enhancements.

---

## Known Issues

- [x] **Quotes/images — external API CORS**
  Fixed via Supabase Edge Function `daily-content` (`supabase/functions/daily-content/index.ts`) which proxies ZenQuotes (`/api/today`) and Bing's HP image archive, returning `{ quote, image }` with CORS headers. Deployed with `verify_jwt: false` (public data, no side effects). Client `src/utils/quotes.ts` calls it with an 8s timeout and falls back to the local QUOTES rotation + picsum on any failure, so the app stays functional if the function is ever down. Per-day localStorage cache preserved.

- [x] **iOS save-question bug**
  Fixed by converting the Settings add/edit forms (and the same pattern in FutureSelf compose/edit and Goals add/edit) from `<div>` + `onClick` Save to `<form onSubmit>` with `type="submit"` and a pre-submit `blur()` of the active element. This pre-dismisses the iOS soft keyboard so its tap-eat race can't swallow the submit, and also gives the keyboard's Return/Go key the expected form semantics. Still worth verifying in-situ on iPhone.

- [ ] **Service worker cache staleness**
  vite-plugin-pwa caches aggressively. After deployments the old bundle can stick around on the iPhone PWA until manually cleared via Safari → Advanced → Website Data. Need a cache-busting strategy for production (e.g., versioned asset filenames already exist, but the SW registration itself may need updating to force a reload on new bundles).

---

## Before Deploy

### Security / credentials audit

- [ ] **Review secret credentials — must complete before pushing to GitHub**
  Before any `git push` to a public or even private repo, walk through these checks to guarantee nothing sensitive gets committed:
  - Confirm `.gitignore` excludes `.env.local`, `.env*.local`, and any `.env` except `.env.example`
  - Grep the codebase for hardcoded keys/tokens: `git grep -i -E "sk-ant-|sb_secret|eyJ[A-Za-z0-9]{50,}|api[-_]?key"`
  - Audit full git history for previously-committed secrets: `git log --all -p | grep -iE "sk-ant-|sb_secret|ANTHROPIC_API_KEY.*=.*[A-Za-z0-9]"`. If anything shows up, rotate the key and consider a history rewrite before pushing.
  - Verify `.env.example` documents where each credential lives (never the value itself):
    - `VITE_SUPABASE_URL` — public project URL, set in `.env.local` (dev) and Vercel env vars (prod)
    - `VITE_SUPABASE_ANON_KEY` — publishable key (sb_publishable_*), public by design, set in `.env.local` (dev) and Vercel env vars (prod)
    - `ANTHROPIC_API_KEY` — **real secret**. NEVER in `.env.local`, NEVER in Vercel. Lives only in Supabase Edge Function secrets (Project Settings → Edge Functions → Secrets). Required by `score-sentiment` function.
  - Double-check the Supabase `service_role` key is not referenced anywhere client-side (it's only used server-side inside edge functions via `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")`, which Supabase auto-injects).

- [ ] **Review authentication settings**
  Tighten or loosen the Supabase Auth configuration for the user experience you want:
  - **Session length**: default is 1-hour access token + 30-day refresh token. Access tokens auto-refresh silently in the browser as long as the refresh token is valid. Longer refresh = fewer re-logins but larger compromise window. Decide what's right for a personal PWA.
  - **Logout/login ergonomics**: test the Settings → Sign out flow on iPhone. Verify that after signing out the next login via Google is smooth (no stuck loading, no duplicate prompts).
  - **Google OAuth redirect URLs**: the Supabase Auth dashboard needs to list every URL the app is accessed from. Currently probably just `http://localhost:5173` for dev. Add the Vercel preview and production URLs before deploy, or auth will break in prod with a redirect error.
  - **Email verification / PKCE / password rules**: mostly N/A for a Google-OAuth-only app but worth confirming the project isn't configured in a way that'll surprise you later.

### Robustness pass

- [ ] **Test Future Self feature on iPhone**
  So far only verified on the desktop dev browser. Install/reinstall the PWA on the iPhone, log in, and run through the full Future Self flow:
  - Creating a note (sentiment + fitness scoring, monkey mood + body reacts)
  - Editing a note (re-scoring, state updates)
  - Deleting a note (aggregate recomputes)
  - Weekly transition (if you want to test: edit a note's `created_at` in the database to an earlier week and confirm it drops out of the aggregate)
  - Error banners appear if the edge function or network fails (remember the iOS debugging pattern — visible error indicators since no console is available)

- [ ] **Global error boundary**
  Wrap the router in a React error boundary so an unhandled error shows a friendly "something went wrong, tap to retry" page instead of a blank/spinning screen. Bonus: log the error to console (and eventually a remote telemetry endpoint) for post-mortem debugging.

- [ ] **Request timeouts**
  Add timeout handling for long-running Supabase calls and edge function invocations. Currently a dead network or hanging request will spin the UI forever. A 15-30s timeout with a user-visible message is enough for a personal app.

- [ ] **Write a README**
  Setup, dev server, env vars, how to run on a fresh machine, how to deploy. Especially important before a public GitHub push — even a minimal README makes the repo explicable to future-you.

- [ ] **Track Supabase migrations in git**
  All schema changes (including the Future Self feature's two migrations) have been applied ad-hoc via the Supabase MCP — there is no `supabase/migrations/` folder in the repo and no version history of the schema. To fix this:
  - `supabase init` to scaffold the local project
  - `supabase db pull` to dump current schema into versioned migration files
  - Commit the `supabase/` folder going forward
  - Use `supabase db push` for future schema changes instead of ad-hoc MCP migrations (or at least keep the two in sync)
  Optional but strongly recommended for schema reproducibility.

- [ ] **Auto-generate `database.types.ts`**
  Currently hand-maintained — drifts from the real schema the moment you forget to update it. Run `supabase gen types typescript --project-id iulkwoisjsxsbroyewff > src/lib/database.types.ts` to generate from the live schema. Make this a pre-commit hook or a manual ritual after every migration.

- [ ] **Standardize edge function workflow**
  Right now edge function state is inconsistent: `daily-content` lives both in the repo (`supabase/functions/daily-content/index.ts`) AND deployed to Supabase, while `score-sentiment` exists ONLY in the deployed Supabase project with no source in the repo. Fix:
  - Backfill `score-sentiment` source into `supabase/functions/score-sentiment/index.ts` by pulling it down via MCP `get_edge_function` (or the dashboard) and committing it.
  - Adopt a single workflow: edit the local file → deploy (MCP this session, or `supabase functions deploy <name>` via the CLI) → commit. Local file is always the source of truth.
  - Once the Supabase CLI is installed and linked (see the "Track Supabase migrations in git" item — this overlaps), prefer `supabase functions deploy` over MCP for deploys so the flow is the same regardless of whether Claude or a human runs it.
  - Document the ritual briefly in the README once it exists.

---

## Deploy

- [ ] **Deploy PWA to Vercel**
  - Create a Vercel project and link the repo
  - Set env vars in Vercel dashboard (Settings → Environment Variables):
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
  - **Do NOT** add `ANTHROPIC_API_KEY` to Vercel. It stays on Supabase Edge Function secrets.
  - Add the Vercel production domain (and preview domain if using) to Google OAuth redirect URLs in Supabase
  - First deploy: verify the PWA manifest + service worker load correctly from the Vercel URL
  - Test install-to-home-screen on iPhone from the production URL
  - Verify the Future Self edge function call works in production (HTTPS, CORS, auth all line up)

---

## Future Enhancements

- [ ] **Future Self avatar upgrade**
  Replace the monkey SVG on the Future Self page specifically with a richer, more expressive avatar. Keep the existing monkey on the Reflect page (it's tied to that feature's celebration/shrug animations). New avatar should still support two independent axes: mood (face) and body width (fitness state).

- [ ] **Polish pass**
  Final UI tweaks, transitions, spacing, typography. Test on multiple iPhone sizes.

- [ ] **Cost/usage monitoring**
  The `score-sentiment` edge function calls Anthropic on every note create/edit. At scale or in a failure loop this could burn credits. Consider adding a per-user rate limit and/or a daily cap. Low priority for a personal app but worth noting.

- [ ] **Welcome / empty-state improvements**
  First-time user on a fresh account should see a clear onboarding — especially now that the Home page has a Future Self card that only makes sense after a few notes exist.
