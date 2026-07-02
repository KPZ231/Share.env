# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Not the Next.js you know

This project uses **Next.js 16.2.10** (bleeding-edge, post-training-cutoff) with React 19.2.4. Before writing App Router code, data fetching, config, or anything Next-specific, read the matching doc under `node_modules/next/dist/docs/01-app/` — APIs and conventions may differ from what you already assume. Don't rely on memorized Next.js behavior for this repo.

The React Compiler is enabled (`reactCompiler: true` in `next.config.ts`, `babel-plugin-react-compiler` installed) — avoid manual `useMemo`/`useCallback` micro-optimizations that the compiler already handles.

## Commands

- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next` core-web-vitals + typescript rules)
- `npx prisma migrate dev` — apply schema changes (generates a new migration folder under `prisma/migrations/`; re-add any hand-written RLS/policy SQL if it touched a table Prisma regenerated)
- `npx prisma generate` — regenerate the Prisma Client after editing `prisma/schema.prisma`
- `npx tsx lib/tokens.ts` — self-check for share-link token generation

There is no test setup in this repo currently.

## Architecture

Minimal App Router structure, no custom code yet beyond the `create-next-app` scaffold:

- `app/layout.tsx` — root layout
- `app/page.tsx` — home page
- `app/globals.css` — Tailwind v4 (via `@tailwindcss/postcss`) global styles
- Path alias `@/*` maps to repo root (see `tsconfig.json`)

## Design tokens

`figma-DESIGN.md` holds a design-system spec extracted from Figma (color palette, typography scale, etc. as YAML frontmatter). Treat it as the source of truth for colors/type/spacing when implementing UI to match the intended design — don't invent new values that duplicate what's already defined there.

## Kontekst aplikacji

Ta aplikacja to darmowy serwis do **bezpiecznego przechowywania i współdzielenia plików środowiskowych (.env)** ze współpracownikami. Pliki .env zawierają sekrety (klucze API, hasła do baz danych) — to jest security-sensitive aplikacja od pierwszej linijki kodu, nie dodatek na później.

Model własności: pliki należą do **workspace'a** (zespołu), a nie bezpośrednio do usera. Współdzielenie działa na trzy sposoby jednocześnie:
1. **Zaproszenie po emailu** — zapraszany musi mieć/założyć konto, dostęp nadawany przez rolę w workspace.
2. **Link z tokenem** — dostęp bez logowania, token z wygaśnięciem i możliwością odwołania.
3. **Workspace/role** — członkowie zespołu mają dostęp wg roli: `owner` / `editor` / `viewer`.

Skala docelowa: średnia (tysiące userów) — projektuj z myślą o limitach darmowych planów (Supabase, Vercel), nie o nieograniczonych zasobach.

## Stack technologiczny

- **Baza danych, Auth, Storage: Supabase** — jeden ekosystem dla wszystkich trzech, ponieważ RLS działa natywnie z `auth.uid()` zarówno w tabelach Postgres jak i w politykach Storage bucketów. Nie wprowadzać osobnego dostawcy auth (np. Auth.js) — powodowałoby to ręczne mapowanie sesji do RLS i podwójne źródło prawdy o tożsamości użytkownika.
- **Schemat i migracje: Prisma** (`prisma/schema.prisma`) — źródło prawdy dla kształtu tabel, zamiast ręcznie pisanego SQL. RLS policies, funkcja `is_workspace_member()` i polityki Storage nie są wyrażalne w Prisma Schema, więc są dopisane ręcznie na końcu `prisma/migrations/0001_init/migration.sql`, pod wyraźnym separatorem — każda zmiana modelu w `schema.prisma` wymaga przejrzenia tej sekcji pod kątem RLS. **Prisma Client (`lib/prisma.ts`) łączy się bezpośrednio z bazą i nie przechodzi przez RLS** (ten sam poziom zaufania co `lib/supabase/admin.ts`) — używać go tylko do operacji trusted/server-side, nie jako zamiennika dla per-userowego dostępu scoped przez RLS, do którego nadal służy `lib/supabase/server.ts`.
- **Hosting: Vercel** — natywna integracja z Next.js, Server Actions i Route Handlers jako edge/serverless functions.
- **i18n: next-intl** — App Router-native, wspiera Server Components. Domyślny locale PL, dodatkowo EN. Żadnych hardcodowanych stringów UI w komponentach — wszystko przez klucze tłumaczeń.
- Szyfrowanie zawartości plików: **server-side / at-rest** (domyślne szyfrowanie Supabase Storage + RLS). Nie wdrażać client-side zero-knowledge encryption — świadomy wybór na rzecz prostoty, przy zachowaniu innych warstw bezpieczeństwa poniżej.

## Bezpieczeństwo (priorytet nadrzędny)

To jest aplikacja przechowująca sekrety innych aplikacji — traktuj każdą zmianę dotykającą danych, dostępu lub udostępniania jako security-critical.

- **RLS włączone na każdej tabeli i buckecie, bez wyjątków.** Domyślnie deny-all, jawne polityki per operacja (`select`/`insert`/`update`/`delete`). Nowa tabela bez RLS = błąd, nie "dodam później".
- **Nigdy nie ufaj danym z klienta.** Waliduj server-side (Server Actions / Route Handlers) nawet gdy RLS też chroni dany zasób — RLS to druga warstwa, nie jedyna.
- **Nie loguj zawartości plików ani sekretów.** Żadnych `console.log`, error trackerów czy analityki, które mogłyby przechwycić treść .env lub tokeny dostępu.
- **Linki z tokenem:** token generowany kryptograficznie bezpiecznie (wysoka entropia, np. `crypto.randomUUID()` lub nanoid), obowiązkowa data wygaśnięcia, możliwość natychmiastowego odwołania (revoke), rate-limiting na endpoincie rozwiązującym token.
- **Zaproszenia email:** token zaproszenia jednorazowy, serwer zawsze weryfikuje, że zapraszający faktycznie ma prawo do zasobu (RLS + jawny check) — nie polegaj na tym, że UI nie pokazuje opcji zaproszenia.
- **Role w workspace (owner/editor/viewer):** uprawnienia wymuszone przez RLS policies, nie tylko ukrywane w UI. Traktuj brak przycisku w interfejsie jako UX, nie jako zabezpieczenie.
- **Rate limiting** na endpointach auth, resolve-token i innych publicznie dostępnych bez sesji.
- **Security headers i CSP** skonfigurowane w `next.config.ts` (`headers()`), sanityzacja nazw plików i wszystkich inputów użytkownika.
- **Zasada najmniejszych uprawnień dla kluczy Supabase:** `service_role` key wyłącznie server-side (Route Handlers/Server Actions), nigdy w kodzie klienta ani w zmiennych `NEXT_PUBLIC_*`.
- **Prisma Client omija RLS całkowicie** (bezpośrednie połączenie DB) — traktować jak `service_role`: tylko server-side, z jawnym uzasadnieniem przy każdym użyciu, nigdy jako domyślny sposób odpytywania danych użytkownika.

## Autoryzacja

- Sesje Supabase Auth przez cookies (SSR-safe), `auth.uid()` jako fundament wszystkich RLS policies.
- Next.js middleware chroni trasy wymagające zalogowania — sprawdzenie sesji przed renderem, nie tylko w komponencie.
- Wzorzec danych: każda tabela z danymi użytkownika ma kolumnę `owner_id` i/lub `workspace_id`, powiązaną z odpowiednią RLS policy — nie polegaj na filtrowaniu po stronie aplikacji.

## Czystość kodu

- TypeScript `strict` (już włączone w `tsconfig.json`) — nie osłabiać, unikać `any`.
- Przed dodaniem nowej funkcji/util sprawdź, czy coś podobnego już istnieje w repo — reużywaj zamiast duplikować.
- Małe komponenty i funkcje o jednej odpowiedzialności; unikać rozrastających się Server Actions robiących walidację + auth + logikę biznesową + zapis w jednym bloku bez podziału.
- `npm run lint` jako bramka jakości przed uznaniem zmiany za gotową.

## Wydajność i skalowalność

- Server Components domyślnie; Client Components (`"use client"`) tylko tam, gdzie faktycznie potrzebna interaktywność.
- Paginacja/limit na listach plików i członków workspace — nigdy nie ładować całej kolekcji naraz.
- Unikaj N+1 query do Supabase — używaj `select` z joinami zamiast pętli zapytań; cache'uj odpowiedzi tam gdzie sensowne (`fetch` cache / `unstable_cache`).
- Indeksy na kolumnach używanych w RLS policies i częstych filtrach (`owner_id`, `workspace_id`, `token`).
- Projektuj pod limity darmowych planów Supabase (rozmiar bazy, transfer, liczba requestów) i Vercel (czas wykonania funkcji, bandwidth) — przy skali "tysiące userów" te limity są realnym ograniczeniem, nie teoretycznym.
