# Graph Report - D:\KPZsProductions\Aplikacje Webowe\env.Share\Share.env  (2026-07-07)

## Corpus Check
- 170 files · ~119,449 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 593 nodes · 1432 edges · 25 communities (18 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 173,987 output

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

## God Nodes (most connected - your core abstractions)
1. `requireUser()` - 83 edges
2. `createClient()` - 60 edges
3. `buildMetadata()` - 33 edges
4. `getUserWorkspaces` - 16 edges
5. `compilerOptions` - 16 edges
6. `resolveActiveWorkspace()` - 15 edges
7. `assertOwner()` - 15 edges
8. `Skeleton()` - 11 edges
9. `getTwoFactorStatus()` - 11 edges
10. `Spinner()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Task 6 Report: Fix Stale Route in lib/auth.ts` --references--> `requireUser()`  [EXTRACTED]
  .superpowers/sdd/task-6-report.md → lib/auth.ts
- `RLS enabled on every table/bucket, deny-by-default` --conceptually_related_to--> `ensureDefaultWorkspace()`  [INFERRED]
  CLAUDE.md → lib/workspace.ts
- `RLS enabled on every table/bucket, deny-by-default` --semantically_similar_to--> `Security is never just UI (design principle)`  [INFERRED] [semantically similar]
  CLAUDE.md → PRODUCT.md
- `Monochrome chrome, color as event (design principle)` --semantically_similar_to--> `Atmospheric accent glows`  [INFERRED] [semantically similar]
  PRODUCT.md → DESIGN-resend.md
- `generateMetadata()` --calls--> `buildMetadata()`  [EXTRACTED]
  app/[locale]/(app)/dashboard/page.tsx → lib/metadata.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Signup/Signin backend implementation flow (Tasks 1-6)** — lib_workspace_ensuredefaultworkspace, app_locale_auth_callback_route_gethandler, app_locale_signup_actions_signupaction, app_locale_signin_actions_signinaction, components_signup_form_handlesubmit, components_signin_form_handlesubmit, lib_auth_requireuser [EXTRACTED 1.00]
- **Security-first design intent documented across governance files** — claude_rls_principle, product_security_never_just_ui, claude_prisma_bypasses_rls [INFERRED 0.85]

## Communities (25 total, 7 thin omitted)

### Community 0 - "Two-Factor & Environment Lock Auth"
Cohesion: 0.07
Nodes (68): ActionResult, AUTH_CHALLENGE_COOKIE(), finishEnvironmentPasskeyAuthAction(), finishTwoFactorStep(), grantTwoFactorStep(), grantUnlock(), ProtectionLevel, removeEnvironmentPasswordAction() (+60 more)

### Community 1 - "Dashboard & Environment CRUD"
Cohesion: 0.07
Nodes (45): cachedOverview, DashboardPage(), EnvironmentsSection(), generateMetadata(), StatTiles(), ActionResult, createEnvironmentAction(), deleteEnvironmentAction() (+37 more)

### Community 2 - "App Layout & Session Bootstrap"
Cohesion: 0.08
Nodes (38): generateMetadata(), EnvironmentsPage(), generateMetadata(), AppLayout(), generateMetadata(), ProfilePage(), generateMetadata(), PublicProfilePage() (+30 more)

### Community 3 - "Signup/Signin & Profile Actions"
Cohesion: 0.07
Nodes (38): ActionResult, confirmAvatarAction(), deleteAccountAction(), exportDataAction(), removeAvatarAction(), toggleIntegrationInterestAction(), updateConsentAction(), updateProfileAction() (+30 more)

### Community 4 - "Workspace Invitations & Membership"
Cohesion: 0.09
Nodes (38): acceptInvitationAction(), generateMetadata(), InvitePage(), ActionResult, changeRoleAction(), createInviteLinkAction(), inviteByEmailAction(), regenerateAccessKeyAction() (+30 more)

### Community 5 - "Nav, Locale & Root Layout"
Cohesion: 0.08
Nodes (26): displaySerif, geistMono, geistSans, metadata, PUBLIC_PATHS, DashboardNavClient(), WorkspaceSwitcher(), DashboardNav() (+18 more)

### Community 6 - "Package Dependencies"
Cohesion: 0.05
Nodes (40): dependencies, gsap, next, next-intl, nodemailer, pg, @phosphor-icons/react, @prisma/adapter-pg (+32 more)

### Community 7 - "Project Docs & Governance"
Cohesion: 0.07
Nodes (35): AGENTS.md — Next.js 16 breaking-changes notice, app/[locale]/auth/callback/route.ts GET handler, sanitizeRedirectTo, signInAction, signUpAction, CLAUDE.md — repo guidance for Claude Code, Prisma Client bypasses RLS (trusted server-side only), RLS enabled on every table/bucket, deny-by-default (+27 more)

### Community 8 - "GitHub Integration & TOTP Crypto"
Cohesion: 0.14
Nodes (24): ActionResult, disconnectGithubAction(), linkEnvironmentRepoAction(), listMyGithubReposAction(), previewRepoCommitsAction(), requireEditorRole(), unlinkEnvironmentRepoAction(), GET() (+16 more)

### Community 10 - "Marketing Home Page"
Cohesion: 0.13
Nodes (13): generateMetadata(), Faq(), FaqItem, FEATURE_ICONS, FeatureItem, Features(), ENV_LINES, Hero() (+5 more)

### Community 11 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 12 - "Marketing Feature/Pricing Pages"
Cohesion: 0.22
Nodes (8): generateMetadata(), Comparison(), FinalCta(), CLI_LINES, Integrations(), ICONS, SecurityDeepDive(), SecurityItem

### Community 13 - "Marketing Use-Cases Page"
Cohesion: 0.15
Nodes (9): generateMetadata(), PageHeroProps, Scenario, UsageScenarios(), ICONS, Persona, UseCasePersonas(), Stat (+1 more)

### Community 14 - "Proxy Middleware & Session"
Cohesion: 0.31
Nodes (9): verifyAccountTwoFactorToken(), isPublicPath(), PUBLIC_PATHS, IMPORTANT: do not run code between createServerClient and getUser  it, stripLocale(), updateSession(), config, handleI18nRouting (+1 more)

### Community 15 - "Pricing & Billing"
Cohesion: 0.46
Nodes (5): PricingCalculator(), Pricing(), CURRENCY_BY_LOCALE, formatPrice(), monthlyCost()

### Community 16 - "Brand Images & Icons"
Cohesion: 0.29
Nodes (7): Shield Mascot Sticker (Tech Security), Metallic Vault/Safe Hero Image, Orange Shield Lock Icon, Share.env Horizontal Logo, Share.env Tagline Splash, Share.env Full Logo with Tagline, Share.env Shield Icon Mark

## Ambiguous Edges - Review These
- `AGENTS.md — Next.js 16 breaking-changes notice` → `README.md — create-next-app scaffold readme`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **143 isolated node(s):** `ActionResult`, `TwoFactorStepResult`, `ActionResult`, `DeleteResult`, `ActionResult` (+138 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `AGENTS.md — Next.js 16 breaking-changes notice` and `README.md — create-next-app scaffold readme`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `requireUser()` connect `App Layout & Session Bootstrap` to `Two-Factor & Environment Lock Auth`, `Dashboard & Environment CRUD`, `Signup/Signin & Profile Actions`, `Workspace Invitations & Membership`, `Nav, Locale & Root Layout`, `Project Docs & Governance`, `GitHub Integration & TOTP Crypto`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **Why does `buildMetadata()` connect `App Layout & Session Bootstrap` to `Dashboard & Environment CRUD`, `Workspace Invitations & Membership`, `Nav, Locale & Root Layout`, `Marketing Home Page`, `Marketing Feature/Pricing Pages`, `Marketing Use-Cases Page`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Two-Factor & Environment Lock Auth` to `Dashboard & Environment CRUD`, `App Layout & Session Bootstrap`, `Signup/Signin & Profile Actions`, `Nav, Locale & Root Layout`, `Project Docs & Governance`, `GitHub Integration & TOTP Crypto`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `ActionResult`, `TwoFactorStepResult`, `ActionResult` to the rest of the system?**
  _148 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Two-Factor & Environment Lock Auth` be split into smaller, more focused modules?**
  _Cohesion score 0.0727036676403765 - nodes in this community are weakly interconnected._
- **Should `Dashboard & Environment CRUD` be split into smaller, more focused modules?**
  _Cohesion score 0.07244843997884717 - nodes in this community are weakly interconnected._