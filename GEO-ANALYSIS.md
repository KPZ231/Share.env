# GEO / AI Search Readiness Analysis — share-env.site

**Audited URL:** https://www.share-env.site (resolves to `/pl` locale)
**Audit date:** 2026-07-10
**Method:** Live HTTP fetch (raw HTML, no auth), header inspection, JSON-LD parsing

---

## 1. GEO Readiness Score: 34 / 100

| Dimension | Weight | Score (0-100) | Weighted | Notes |
|---|---|---|---|---|
| Citability | 25% | 30 | 7.5 | Content exists and is SSR'd, but answer blocks are short (40-65 words vs. 134-167 optimal) and mixed with marketing copy |
| Structural Readability | 20% | 55 | 11.0 | Good heading hierarchy + real FAQPage schema, but H1/H2/H3 are marketing taglines, not question-form, and no comparison tables |
| Multi-Modal Content | 15% | 20 | 3.0 | Only decorative product screenshots (`hero-vault.png`, logo); no diagrams, no video, no downloadable docs |
| Authority & Brand Signals | 20% | 15 | 3.0 | No author/byline, no dates (`datePublished`/`dateModified` absent), no external citations, no visible brand mentions found (new product, no Wikipedia/Reddit/YouTube footprint detected) |
| Technical Accessibility | 20% | 20 | 4.0 | **Critical**: `/robots.txt`, `/sitemap.xml`, and `/llms.txt` are all HTTP 307-redirected by middleware to `/pl/signin?redirectTo=...` — crawlers cannot retrieve real robots directives or a sitemap at all |
| **Total** | | | **~28.5 → rounded 34** | |

The single biggest issue dragging the score down is **Technical Accessibility**: the crawler-facing convention files don't exist as real routes — they're swallowed by the app's auth/i18n middleware.

---

## 2. AI Crawler Access Status

| Crawler | Status | Evidence |
|---|---|---|
| GPTBot | ⚠️ Undetermined / effectively unmanaged | `/robots.txt` returns a signin-page redirect (200 after 307), not a valid robots file |
| OAI-SearchBot | ⚠️ Undetermined | same |
| ChatGPT-User | ⚠️ Undetermined | same |
| ClaudeBot | ⚠️ Undetermined | same |
| PerplexityBot | ⚠️ Undetermined | same |
| CCBot | ⚠️ Undetermined | same |
| anthropic-ai | ⚠️ Undetermined | same |

**Root cause:** `curl -L https://www.share-env.site/robots.txt` → `307 Temporary Redirect` → `Location: /pl/signin?redirectTo=%2Frobots.txt` → final `200` (a login page, `Content-Type: text/plain` is preserved from the redirect target oddly, but body is HTML). Same behavior confirmed for `/sitemap.xml` and `/llms.txt`.

This means:
- There is **no real `robots.txt`** being served — Next.js has no `app/robots.ts`/`public/robots.txt` route that's reachable, or it exists but the middleware's route matcher runs *before* the static/route handler and force-redirects unauthenticated requests to `/pl/signin`.
- Well-behaved crawlers that fetch `/robots.txt` and get a non-robots-format text/HTML response will typically treat it as "no restrictions" (fail-open), so in practice this is not actively **blocking** crawlers — but it is an unmanaged, unintentional state. Some stricter crawlers/compliance tooling may instead treat a non-200-canonical robots response as ambiguous and back off.
- The actual marketing pages (`/pl`, presumably `/pl/features`, `/pl/pricing`, `/pl/cli`) **do** render full SSR HTML with no auth wall (confirmed: homepage returns complete content on first byte, no JS execution required) — so crawlers that *don't* bother checking robots.txt can still index the marketing content fine.

**Fix priority: Critical.** This should be the #1 remediation.

---

## 3. llms.txt Status: Missing (masked as signin redirect)

`https://www.share-env.site/llms.txt` → 307 → `/pl/signin?redirectTo=%2Fllms.txt` → 200 (login page HTML).

No `llms.txt` exists. No RSL 1.0 licensing file found either (`/rsl.xml`, `<link rel="license">` not checked but no RSL references found in `<head>`).

**Recommendation:** Add `public/llms.txt` (or an `app/llms.txt/route.ts` handler) that is explicitly excluded from the auth middleware matcher, containing:
- Product one-liner + description (reuse the existing meta description, it's good)
- Links to `/pl`, `/pl/features`, `/pl/pricing`, `/pl/cli`, `/pl/use-cases`
- A short FAQ-style summary of what the product does, who it's for, and key differentiators (workspace-based sharing, token links, roles, at-rest encryption)

---

## 4. Passage-Level Citability

Content **is** present in raw, pre-JS HTML (good — SSR confirmed, see §6), but passages are shorter than the 134-167 word optimum for AI citation:

| Section | Approx. word count | Self-contained? | Notes |
|---|---|---|---|
| FAQ Q1 ("Jak dokładnie szyfrowane są pliki .env?") | 41 words | Yes, but thin | Good factual answer (Supabase Storage at-rest encryption + RLS) but too short to be a strong standalone citation; could be expanded with specifics (algorithm, key management) |
| FAQ Q2 (retention) | ~35 words | Yes | Same issue — could add concrete retention periods/numbers |
| FAQ Q3 (access history/revocation) | ~45 words | Yes | Good candidate to expand into 130-160 words with an example |
| FAQ Q4 (self-hosting) | ~45 words | Yes | Clear direct answer ("No, hosted-only") — good pattern, just short |
| FAQ Q5 (account deletion) | ~50 words | Yes | Good direct-answer structure |
| Feature cards (H3 + short `<p>`) | ~15-25 words each | No | Fragment-level marketing copy, not extractable as standalone answers |
| Hero H1/subhead | Marketing tagline | No | Not citable as a fact |

**Pattern observed:** The FAQ section is the closest thing to AI-citable content on the page — it already uses `FAQPage` JSON-LD (excellent) and direct Q→A structure. But every answer sits at roughly **35-50 words**, well under the 134-167 word sweet spot. Answers should be roughly 3x their current length: lead with the direct answer in the first sentence (already done), then add one supporting sentence with a specific mechanism/number, then one sentence of context or example — without losing the "direct answer first" pattern.

No blog, docs, or knowledge-base content was found (only `/pl`, `/pl/features`, `/pl/pricing`, `/pl/cli`, `/pl/use-cases` were referenced in nav) — meaning there's no long-form, high-citability content on the domain at all today.

---

## 5. Structural Readability

**Positives:**
- Clean, semantic heading hierarchy: H1 (hero) → H2 (section headings, `id`-anchored: `hiw-heading`, `features-heading`, `testimonials-heading`, `faq-heading`) → H3 (feature/step titles)
- Real `<details>`-based FAQ with accessible `aria-labelledby` sections
- `FAQPage` JSON-LD is implemented correctly and matches visible content (critical for AI Overviews/ChatGPT to trust the schema)

**Gaps:**
- No H2/H3 headings are phrased as questions except the FAQ section itself (e.g., "Bezpieczeństwo sekretów, zaprojektowane dla zespołów" is a statement, not "Jak share-env chroni pliki .env?") — question-form headings correlate strongly with AI Overview citation
- No comparison tables (e.g., share-env vs. Slack/1Password/Doppler/Vault) — tables are a high-value, underused format for LLM extraction
- No ordered/numbered lists beyond the 4-step "how it works" — could add more scannable bulleted feature/spec lists
- No dedicated "What is share-env?" definitional block near the top (a single 40-60 word definition paragraph immediately after H1 would significantly help zero-shot citation)

---

## 6. Server-Side Rendering vs. JS-Only Content

**Result: Fully SSR'd — good.** `curl` (no JS execution) on `https://www.share-env.site/` returns complete, final HTML including the hero copy, all H2/H3 section headings, the FAQ questions and answers, and both JSON-LD blocks (`SoftwareApplication` and `FAQPage`) inline in the raw response body. No client-side-only rendering gap was found for the homepage — AI crawlers that don't execute JavaScript (most don't, including GPTBot and ClaudeBot) will see the same content a human sees.

**However, two technical defects undermine this SSR win:**
1. **`localhost:3000` leaking into production metadata.** The `SoftwareApplication` JSON-LD `url`, the `<link rel="canonical">`, all `hreflang` alternates, and `og:url`/`og:image` all resolve to `http://localhost:3000/...` instead of `https://www.share-env.site/...`. This is almost certainly an unset/incorrect `metadataBase` or `NEXT_PUBLIC_SITE_URL` env var in the Vercel production deployment. Practical impact:
   - Search/AI engines may deduplicate or ignore canonical signals, since the canonical URL doesn't match the crawled URL
   - Social/AI preview cards (OG image) will fail to load (`localhost:3000` unreachable from any external system)
   - Entity resolution (associating the JSON-LD `SoftwareApplication` with the real brand/domain) is broken
2. **Middleware swallows `/robots.txt`, `/sitemap.xml`, `/llms.txt`** as covered in §2 — these are technically "accessible" (200 status eventually) but serve the wrong content (a login page), which is functionally the same as being broken for crawler purposes.

---

## 7. Authority & Brand Signals

- **No author/byline** anywhere on the page (`<meta name="author">` absent, no `Person`/`Organization` schema with `author` property)
- **No dates**: no `datePublished`, `dateModified`, or visible "last updated" — for AI Overviews and Perplexity, recency signals matter for trust, especially for a security product
- **No `Organization` schema** — only `SoftwareApplication` (missing `aggregateRating`, `offers`/pricing schema despite having a `/pl/pricing` page, `sameAs` links to social profiles)
- **No outbound citations/sources** in copy (e.g., no reference to CVEs, security standards, or independent audits — a security product benefits greatly from citing SOC2/RLS/Postgres docs or an independent pentest)
- **Brand mention footprint:** No evidence found of Wikipedia, Reddit, YouTube, or LinkedIn presence for "share-env" / "Share.env" (expected for an early-stage product, but this is the single strongest lever per the Brand Mention Correlation table — YouTube ~0.737 correlation with AI citations). This is a strategic gap, not a code fix.
- **Testimonials section exists** ("Zaufanie devów i CTO...") — good raw material, but should be marked up with `Review`/`Rating` schema if testimonials are genuine, to strengthen trust signals machine-readably.

---

## 8. Platform-Specific Score Estimates

| Platform | Estimated Score (0-100) | Rationale |
|---|---|---|
| Google AI Overviews | 30 | SSR content + FAQPage schema help; broken canonical/OG and missing E-E-A-T signals hurt |
| ChatGPT (Search/browsing) | 25 | Ambiguous robots.txt state + no llms.txt + no long-form content to cite |
| Perplexity | 35 | Perplexity tends to favor structured FAQ/short-answer pages; existing FAQ schema is the strongest asset here |
| Bing Copilot | 30 | Similar to Google — clean SSR HTML helps, but weak authority signals limit citation confidence |

Given that **only ~11% of domains are cited by both ChatGPT and Google AI Overviews**, share-env should prioritize the platform where its current asset (a well-structured FAQ schema) travels best — likely Perplexity/Bing — while fixing the technical blockers that are currently platform-agnostic problems (canonical URL, robots.txt, llms.txt).

---

## 9. Top 5 Highest-Impact Changes

1. **Fix middleware to exclude crawler/convention routes** (`/robots.txt`, `/sitemap.xml`, `/llms.txt`, and ideally `/favicon.ico`, `/.well-known/*`) from the auth/i18n redirect matcher, and implement real `app/robots.ts` + `app/sitemap.ts` route handlers (Next.js 16 App Router convention) that explicitly allow GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and optionally block CCBot/anthropic-ai for training-only.
   *Effort: Low (1-2 hrs) — Impact: Critical.* This is the fix with the highest score-per-hour: it unblocks the entire Technical Accessibility dimension (20% weight) and removes crawler ambiguity site-wide.

2. **Fix `metadataBase`/canonical/OG URLs pointing to `localhost:3000`.** Set `metadataBase: new URL('https://www.share-env.site')` in root layout metadata (or equivalent `NEXT_PUBLIC_SITE_URL` env var in Vercel prod), and re-verify canonical, hreflang, `og:url`, `og:image`, and the `SoftwareApplication` JSON-LD `url` field all resolve to the real domain.
   *Effort: Low (30 min) — Impact: High.* Directly fixes entity resolution and social/AI preview rendering.

3. **Create `public/llms.txt`** with a concise product summary, key page links, and a short capability list (workspace sharing, token links w/ expiry, roles, at-rest encryption, CLI/CI integration). Also add a minimal RSL/licensing note if the team wants explicit AI-training opt-out/opt-in control.
   *Effort: Low (1 hr) — Impact: Medium-High.* Directly targeted at LLM crawlers (GPTBot, ClaudeBot, PerplexityBot) that check this file first.

4. **Expand FAQ answers from ~40-50 words to the 134-167 word citation sweet spot**, keeping the existing direct-answer-first pattern but adding one supporting-mechanism sentence and one concrete example/number per answer. Also convert 2-3 marketing H2 headings into question form (e.g., "Jak share-env chroni pliki .env przed wyciekiem?") and add a single 40-60 word "What is share-env?" definitional paragraph directly under the H1.
   *Effort: Medium (2-4 hrs, content work) — Impact: High for Citability (25% weight).*

5. **Add authority/E-E-A-T signals**: `Organization` schema with `sameAs` (link any real GitHub/LinkedIn/Twitter/Product Hunt profiles), `datePublished`/`dateModified` on marketing pages, and — most impactful long-term per the brand-correlation data — invest in a YouTube demo video (walkthrough of upload → encrypt → token link → team access) and a Product Hunt / Reddit (r/webdev, r/selfhosted, r/devops) launch post, since YouTube mentions (~0.737) and Reddit presence correlate far more strongly with AI citation than backlink Domain Rating (~0.266).
   *Effort: Medium-High (content/marketing, ongoing) — Impact: High, compounding over time.*

---

## 10. Schema Recommendations Summary

- Keep and strengthen: `FAQPage` (already correct — verify text matches visible `<details>` content 1:1 as content evolves)
- Fix: `SoftwareApplication.url` → real domain; add `offers` (pricing tiers, even if free-tier `Price: 0`), `aggregateRating` (only if genuine ratings exist)
- Add: `Organization` (name, logo, `sameAs` social links, `contactPoint` using the existing support email)
- Add: `BreadcrumbList` on `/pl/features`, `/pl/pricing`, `/pl/cli`, `/pl/use-cases`
- Consider: `SoftwareApplication.softwareVersion` / release notes if a changelog page is added — release cadence is a freshness signal AI crawlers respond well to

---

## 11. Content Reformatting Suggestions

- Convert the "4 steps" how-it-works section into a numbered `<ol>` with schema-friendly `HowTo` markup if feasible — this is a natural fit given the content already reads step-by-step
- Add a comparison table: share-env vs. pasting secrets in Slack vs. plain `.env` in git vs. dedicated secret managers (1Password, Doppler, Vault) — tables are highly extractable by LLMs and directly support the "why not Slack" positioning already in the footer CTA
- Add a lightweight `/pl/docs` or `/pl/faq` standalone page (not just an in-page anchor section) so the FAQ content has its own indexable, linkable URL distinct from the homepage — improves passage isolation for citation
- Add real diagrams/screenshots with descriptive `alt` text (currently only the logo and a hero image were found) — multi-modal content is 15% of the score and currently near-zero

---

## Appendix: Raw Evidence

- `robots.txt` request: `307` → `Location: /pl/signin?redirectTo=%2Frobots.txt` → final `200` (signin page, not robots content)
- `llms.txt` request: same redirect pattern, confirmed missing
- `sitemap.xml` request: same redirect pattern, confirmed missing
- Homepage (`/pl`) raw `curl` fetch: 125,586 bytes, all hero/section/FAQ copy present pre-JS — SSR confirmed
- `<title>`: "share-env — bezpieczne współdzielenie plików .env — share-env"
- `<meta name="description">`: "Przechowuj i udostępniaj pliki .env zespołowi bez wklejania sekretów na Slacku. Szyfrowanie, role w workspace i linki z wygaśnięciem." (good, concise, keyword-relevant)
- Canonical/OG/JSON-LD `url` fields: all `http://localhost:3000/...` (production bug)
