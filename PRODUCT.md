# Product

## Register

brand

Note: this is the default for marketing/landing surfaces (homepage, pricing, docs marketing pages). App UI (signin, signup, dashboards, workspace management) should be treated as `product` register on a per-task basis — design SERVES the product there, it doesn't lead it.

## Users

Small-to-medium engineering teams (target scale: thousands of users) who need to share `.env` files containing real secrets (API keys, DB passwords) with teammates without pasting them into Slack or email. Users arrive either as the person setting up a workspace and inviting teammates, or as an invitee/link-recipient who needs to retrieve a secret quickly and trust that it was handled safely in transit. They are technical (developers, DevOps, founders) and security-conscious by necessity — the product is trusted with real secrets, so credibility signals matter as much as usability.

## Product Purpose

A free service for securely storing and sharing `.env` files across a team, with three access paths (email invite, tokened link, workspace role) and Supabase-backed RLS, encryption at rest, and revocable expiring links. Success looks like: a user replaces "pasting an API key in Slack" with a two-minute upload-and-share flow, and every viewer/collaborator can tell — from the product's professionalism — that access controls and expiry are being taken seriously, not bolted on.

## Brand Personality

Confident, technical, trustworthy. The voice speaks like a competent engineer, not a compliance form: direct, precise, no filler reassurance ("bank-grade security!"), let real facts (AES-256, RLS, expiring tokens) do the persuading. Editorial confidence (drawing on the adopted Figma-style monochrome + pastel color-block system) rather than corporate/enterprise coldness — the tool should feel like it was made by people who care about craft, not just compliance.

## Anti-references

Avoid the generic 2025 AI-slop SaaS template: gradient-mesh hero backgrounds, cream/sand near-white body backgrounds, tiny uppercase tracked eyebrows on every section, identical icon+heading+text card grids, gradient text, side-stripe accent borders. None of these belong here — the adopted design system (monochrome editorial chrome + oversized pastel color-block storytelling sections, pill CTAs, figmaSans/Inter type) is the deliberate alternative to that look.

## Design Principles

1. **Facts over reassurance.** Persuade with concrete security facts (encryption, RLS, token expiry, revocation) rather than vague trust language — the audience is technical and will see through generic SaaS trust-badge copy.
2. **Monochrome chrome, color as event.** Keep nav, body copy, and primary CTAs strictly black/white; reserve the pastel block-color palette for full-width storytelling sections so color reads as a deliberate narrative beat, not decoration.
3. **One primary action per view.** Every screen has exactly one black `button-primary`; if two would appear in the same viewport, demote one to secondary — this keeps the confident-CTA signature legible.
4. **Weight carries hierarchy, not gray.** Body text stays near-black; hierarchy comes from type weight and size, never from washed-out gray-on-light, which also protects contrast for the security-conscious, broad-scale audience.
5. **Security is never just UI.** Every access-control or sharing affordance in the design must be backed by a real RLS policy or server check — the interface should never imply protection that the backend doesn't enforce.

## Accessibility & Inclusion

Target WCAG 2.1 AA: ≥4.5:1 contrast for body text (including on the pastel color-block sections — verify each block color against its ink color, don't assume pastel = automatically safe), ≥3:1 for large/display text, full keyboard navigation, visible focus states, and `prefers-reduced-motion` alternatives for any scroll-driven or reveal animation. Color is never the sole signal for state (e.g. error/success) given the color-block system's heavy reliance on hue.
