# Graph Report - Share.env  (2026-07-09)

## Corpus Check
- 215 files · ~140,193 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 930 nodes · 2048 edges · 70 communities (44 shown, 26 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `571de8ee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Two-Factor & Environment Lock Auth
- Dashboard & Environment CRUD
- App Layout & Session Bootstrap
- Signup/Signin & Profile Actions
- Workspace Invitations & Membership
- Nav, Locale & Root Layout
- Package Dependencies
- Project Docs & Governance
- GitHub Integration & TOTP Crypto
- Loading Skeletons
- Marketing Home Page
- TypeScript Config
- Marketing Feature/Pricing Pages
- Marketing Use-Cases Page
- Proxy Middleware & Session
- Pricing & Billing
- Brand Images & Icons
- Privacy Policy Page
- Pricing FAQ
- Rate Limiting
- Next.js Config
- ESLint Config
- PostCSS Config
- dashboard.ts
- page.tsx
- package.json
- page.tsx
- CLAUDE.md
- Architecture
- footer.tsx
- navigation.ts
- Product
- layout.tsx
- layout.tsx
- Task 5 Report — Wire client forms to Server Actions
- Task 3 Report — signUpAction Server Action
- Progress ledger — backend for /signup and /signin
- Task 1 Report: lib/workspace.ts
- Task 2 Report — /auth/callback route handler
- Task 4 Report — app/[locale]/signin/actions.ts
- marketing-mail-selfcheck.ts
- task-6-brief.md
- Task 6 Report: Fix Stale Route in `lib/auth.ts`
- envshare CLI
- README.md
- wipe-env-files.ts
- AGENTS.md
- task-1-brief.md
- task-2-brief.md
- task-3-brief.md
- task-4-brief.md
- task-5-brief.md
- app/[locale]/auth/callback/route.ts GET handler
- sanitizeRedirectTo
- signInAction
- signUpAction
- Prisma Client bypasses RLS (trusted server-side only)
- RLS enabled on every table/bucket, deny-by-default
- Supabase as single Auth/DB/Storage ecosystem
- components/signin-form.tsx handleSubmit/handleOAuth
- components/signup-form.tsx handleSubmit/handleOAuth
- Atmospheric accent glows
- Domaine Display typeface
- Hairline-border elevation (no drop shadows)
- Facts over reassurance (design principle)
- Monochrome chrome, color as event (design principle)
- Security is never just UI (design principle)
- accept-actions.ts

## God Nodes (most connected - your core abstractions)
1. `requireUser()` - 92 edges
2. `createClient()` - 64 edges
3. `buildMetadata()` - 51 edges
4. `resolveActiveWorkspace()` - 21 edges
5. `assertOwner()` - 19 edges
6. `getUserWorkspaces` - 16 edges
7. `compilerOptions` - 16 edges
8. `hashToken()` - 14 edges
9. `Breadcrumbs()` - 11 edges
10. `Skeleton()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `CliAuthorizePage()` --calls--> `requireUser()`  [EXTRACTED]
  app/[locale]/(app)/cli/authorize/page.tsx → lib/auth.ts
- `generateMetadata()` --calls--> `buildMetadata()`  [EXTRACTED]
  app/[locale]/(app)/dashboard/page.tsx → lib/metadata.ts
- `generateMetadata()` --calls--> `buildMetadata()`  [EXTRACTED]
  app/[locale]/(app)/environments/[id]/page.tsx → lib/metadata.ts
- `generateMetadata()` --calls--> `buildMetadata()`  [EXTRACTED]
  app/[locale]/(app)/environments/new/page.tsx → lib/metadata.ts
- `generateMetadata()` --calls--> `buildMetadata()`  [EXTRACTED]
  app/[locale]/(app)/environments/page.tsx → lib/metadata.ts

## Import Cycles
- None detected.

## Communities (70 total, 26 thin omitted)

### Community 0 - "Two-Factor & Environment Lock Auth"
Cohesion: 0.09
Nodes (52): ActionResult, AUTH_CHALLENGE_COOKIE(), finishEnvironmentPasskeyAuthAction(), finishTwoFactorStep(), grantTwoFactorStep(), grantUnlock(), removeEnvironmentPasswordAction(), requireEditorRole() (+44 more)

### Community 1 - "Dashboard & Environment CRUD"
Cohesion: 0.07
Nodes (52): POST(), GET(), POST(), GET(), ComponentStatus, GET(), supabaseHealth(), timed() (+44 more)

### Community 2 - "App Layout & Session Bootstrap"
Cohesion: 0.18
Nodes (17): deleteEnvironmentAction(), ActionResult, confirmAvatarAction(), deleteAccountAction(), exportDataAction(), removeAvatarAction(), toggleIntegrationInterestAction(), updateConsentAction() (+9 more)

### Community 3 - "Signup/Signin & Profile Actions"
Cohesion: 0.13
Nodes (22): signInAction(), SignInResult, SignInValues, fallbackOrigin(), signUpAction(), SignUpResult, SignUpValues, FieldErrors (+14 more)

### Community 4 - "Workspace Invitations & Membership"
Cohesion: 0.07
Nodes (42): POST(), DELETE(), CliAuthorizeResult, respondToCliAuthAction(), generateMetadata(), InvitePage(), ActionResult, changeRoleAction() (+34 more)

### Community 5 - "Nav, Locale & Root Layout"
Cohesion: 0.06
Nodes (36): displaySerif, geistMono, geistSans, metadata, PUBLIC_PATHS, CookieConsentBanner(), DashboardNavClient(), WorkspaceSwitcher() (+28 more)

### Community 6 - "Package Dependencies"
Cohesion: 0.05
Nodes (41): dependencies, gsap, next, next-intl, pg, @phosphor-icons/react, @prisma/adapter-pg, @prisma/client (+33 more)

### Community 7 - "Project Docs & Governance"
Cohesion: 0.05
Nodes (36): Border Radius Scale, Brand & Accent, Breakpoints, Buttons, Cards & Containers, Collapsing Strategy, Colors, Components (+28 more)

### Community 8 - "GitHub Integration & TOTP Crypto"
Cohesion: 0.20
Nodes (22): api(), c, clone(), commands, CONFIG_DIR, CONFIG_PATH, downloadEnvFile(), fail() (+14 more)

### Community 10 - "Marketing Home Page"
Cohesion: 0.13
Nodes (13): generateMetadata(), Faq(), FaqItem, FEATURE_ICONS, FeatureItem, Features(), ENV_LINES, Hero() (+5 more)

### Community 11 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 12 - "Marketing Feature/Pricing Pages"
Cohesion: 0.16
Nodes (11): generateMetadata(), generateMetadata(), Comparison(), FinalCta(), CLI_LINES, Integrations(), FaqItem, PricingFaq() (+3 more)

### Community 13 - "Marketing Use-Cases Page"
Cohesion: 0.15
Nodes (9): generateMetadata(), PageHeroProps, Scenario, UsageScenarios(), ICONS, Persona, UseCasePersonas(), Stat (+1 more)

### Community 14 - "Proxy Middleware & Session"
Cohesion: 0.09
Nodes (32): ProtectionLevel, EnvironmentDetailPage(), generateMetadata(), ALLOWED_EXPIRY_DAYS, createEnvironmentShareLinkAction(), revokeEnvironmentShareLinkAction(), ShareActionResult, siteOrigin() (+24 more)

### Community 15 - "Pricing & Billing"
Cohesion: 0.06
Nodes (52): findWorkspaceIdBySubscription(), POST(), cachedOverview, DashboardPage(), EnvironmentsSection(), generateMetadata(), StatTiles(), generateMetadata() (+44 more)

### Community 16 - "Brand Images & Icons"
Cohesion: 0.29
Nodes (7): Shield Mascot Sticker (Tech Security), Metallic Vault/Safe Hero Image, Orange Shield Lock Icon, Share.env Horizontal Logo, Share.env Tagline Splash, Share.env Full Logo with Tagline, Share.env Shield Icon Mark

### Community 17 - "Privacy Policy Page"
Cohesion: 0.14
Nodes (14): CliAuthorizePage(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata(), generateMetadata() (+6 more)

### Community 18 - "Pricing FAQ"
Cohesion: 0.26
Nodes (9): generateMetadata(), OnboardingForm(), Option, ACCOUNT_TYPE_OPTIONS, AccountType, COMPANY_SIZE_OPTIONS, CompanySize, REFERRAL_SOURCE_OPTIONS (+1 more)

### Community 19 - "Rate Limiting"
Cohesion: 0.19
Nodes (18): ActionResult, disconnectGithubAction(), linkEnvironmentRepoAction(), listMyGithubReposAction(), previewRepoCommitsAction(), requireEditorRole(), unlinkEnvironmentRepoAction(), GithubPanel() (+10 more)

### Community 25 - "dashboard.ts"
Cohesion: 0.24
Nodes (16): ActionResult, confirmTotpEnrollmentAction(), deleteTotpCredentialAction(), deleteWebauthnCredentialAction(), finishPasskeyRegistrationAction(), startPasskeyRegistrationAction(), startTotpEnrollmentAction(), Verify2faPage() (+8 more)

### Community 26 - "page.tsx"
Cohesion: 0.27
Nodes (10): ProfilePage(), PublicProfilePage(), ProfileView(), getGithubConnectionInfo(), EMPTY_PROFILE_DEFAULTS, getAvatarSignedUrl(), getOrCreateProfile, getPublicProfile() (+2 more)

### Community 27 - "package.json"
Cohesion: 0.12
Nodes (15): bin, envshare, description, engines, node, files, keywords, license (+7 more)

### Community 28 - "page.tsx"
Cohesion: 0.17
Nodes (9): generateMetadata(), CliCommands(), Command, CliInstall(), CLI_LINES, CliOverview(), CliUseCases(), ICONS (+1 more)

### Community 29 - "CLAUDE.md"
Cohesion: 0.15
Nodes (11): Architecture, Autoryzacja, Bezpieczeństwo (priorytet nadrzędny), Commands, Czystość kodu, Design tokens, graphify, Kontekst aplikacji (+3 more)

### Community 30 - "Architecture"
Cohesion: 0.17
Nodes (11): 1. Device code auth flow, 2. New API routes (`app/api/cli/*`), 3. Shared unlock logic, 4. CLI package, 5. Security, Architecture, CLI tool for env.Share — design, Goal (+3 more)

### Community 31 - "footer.tsx"
Cohesion: 0.16
Nodes (16): acceptInvitationAction(), AppLayout(), createWorkspaceAction(), CreateWorkspaceResult, OnboardingSurveyAnswers, OnboardingPage(), Navbar(), setActiveWorkspaceAction() (+8 more)

### Community 32 - "navigation.ts"
Cohesion: 0.28
Nodes (4): generateMetadata(), generateMetadata(), AuthPanel(), SigninForm()

### Community 33 - "Product"
Cohesion: 0.22
Nodes (8): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Product, Product Purpose, Register, Users

### Community 34 - "layout.tsx"
Cohesion: 0.43
Nodes (4): GET(), GET(), signGithubOAuthState(), sanitizeRedirectTo()

### Community 35 - "layout.tsx"
Cohesion: 0.70
Nodes (4): GET(), verifyGithubOAuthState(), saveGithubConnection(), exchangeGithubCode()

### Community 36 - "Task 5 Report — Wire client forms to Server Actions"
Cohesion: 0.25
Nodes (7): Changes, `components/signin-form.tsx`, `components/signup-form.tsx`, Git, Limitations, Task 5 Report — Wire client forms to Server Actions, Verification

### Community 37 - "Task 3 Report — signUpAction Server Action"
Cohesion: 0.29
Nodes (6): Files touched, Git, Manual validation-branch walkthrough (reasoned, not executed against a live server), Task 3 Report — signUpAction Server Action, Verification, What was built

### Community 38 - "Progress ledger — backend for /signup and /signin"
Cohesion: 0.33
Nodes (5): All 6 tasks complete., Final whole-branch review: complete (verdict "With fixes", no Critical findings), Next: superpowers:finishing-a-development-branch to decide how to integrate this work., Progress ledger — backend for /signup and /signin, Tasks (headings renamed in plan file to match task-brief script convention)

### Community 39 - "Task 1 Report: lib/workspace.ts"
Cohesion: 0.33
Nodes (5): Concerns, Git, Task 1 Report: lib/workspace.ts, Verification, What was built

### Community 40 - "Task 2 Report — /auth/callback route handler"
Cohesion: 0.33
Nodes (5): Git, Open-redirect sanitization (`sanitizeRedirectTo`), Task 2 Report — /auth/callback route handler, Verification, What was built

### Community 41 - "Task 4 Report — app/[locale]/signin/actions.ts"
Cohesion: 0.33
Nodes (5): Git, Judgment calls, Task 4 Report — app/[locale]/signin/actions.ts, Verification, What was built

### Community 42 - "marketing-mail-selfcheck.ts"
Cohesion: 0.40
Nodes (3): CampaignKind, profiles, users

### Community 43 - "task-6-brief.md"
Cohesion: 0.40
Nodes (4): Out of scope (note as follow-ups), Security checklist (must hold), Task 6: Fix stale route in `lib/auth.ts`, Verification (end-to-end)

### Community 44 - "Task 6 Report: Fix Stale Route in `lib/auth.ts`"
Cohesion: 0.40
Nodes (4): Change Made, Summary, Task 6 Report: Fix Stale Route in `lib/auth.ts`, Verification Results

### Community 45 - "envshare CLI"
Cohesion: 0.50
Nodes (3): envshare CLI, Local development, Publishing (maintainers)

### Community 46 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 47 - "wipe-env-files.ts"
Cohesion: 0.67
Nodes (3): createAdminClient(), main(), prisma

## Knowledge Gaps
- **284 isolated node(s):** `CliAuthorizeResult`, `ActionResult`, `TwoFactorStepResult`, `ShareActionResult`, `ActionResult` (+279 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireUser()` connect `dashboard.ts` to `Two-Factor & Environment Lock Auth`, `Dashboard & Environment CRUD`, `App Layout & Session Bootstrap`, `layout.tsx`, `Workspace Invitations & Membership`, `accept-actions.ts`, `layout.tsx`, `Proxy Middleware & Session`, `Pricing & Billing`, `Privacy Policy Page`, `Rate Limiting`, `page.tsx`, `footer.tsx`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `buildMetadata()` connect `Privacy Policy Page` to `navigation.ts`, `Workspace Invitations & Membership`, `Marketing Home Page`, `Marketing Feature/Pricing Pages`, `Marketing Use-Cases Page`, `Proxy Middleware & Session`, `Pricing & Billing`, `Pricing FAQ`, `dashboard.ts`, `page.tsx`, `page.tsx`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Package Dependencies` to `dashboard.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `CliAuthorizeResult`, `ActionResult`, `TwoFactorStepResult` to the rest of the system?**
  _292 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Two-Factor & Environment Lock Auth` be split into smaller, more focused modules?**
  _Cohesion score 0.08766803039158387 - nodes in this community are weakly interconnected._
- **Should `Dashboard & Environment CRUD` be split into smaller, more focused modules?**
  _Cohesion score 0.07111501316944688 - nodes in this community are weakly interconnected._
- **Should `Signup/Signin & Profile Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.12903225806451613 - nodes in this community are weakly interconnected._