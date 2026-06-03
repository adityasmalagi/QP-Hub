## Goal

Push the homepage from "nice" to genuinely cool — without changing any features, data, or routes. Pure presentation layer.

## Visual direction

- **Palette:** keep the existing light lavender / purple-blue identity (per project memory). Add deeper jewel-tone accents: indigo `#4f46e5`, electric violet `#8b5cf6`, cyan glow `#22d3ee` for the dark hero only.
- **Typography:** keep Plus Jakarta Sans for body, add **Space Grotesk** for display headings (h1/h2) for more character. Installed via `@fontsource/space-grotesk`, wired into Tailwind as `font-display`.
- **Motion:** subtle, premium. No parallax overload.

## Changes

### 1. Hero section (`src/pages/Index.tsx`)
- Replace static parallax layers with an **animated mesh-gradient background** (3 blurred radial blobs that drift slowly via CSS keyframes — no JS scroll listener needed, remove the `scrollY` state).
- Add a fine **animated grid overlay** (low-opacity SVG dot grid) for depth.
- Headline: use new `font-display` (Space Grotesk), tighter tracking, larger on desktop (up to `text-8xl`). The gradient word "From Anywhere" gets an animated **aurora text** shimmer (hue rotation on the gradient).
- Sparkle pill: refine with a thinner border + subtle inner glow, replace generic "Your Academic Success Partner" styling with a small glowing dot indicator.
- CTAs: differentiate the two buttons — **Browse Papers** stays solid gradient, **Upload Paper** becomes a glass/outline secondary with the same shine sweep. Currently both look identical which weakens hierarchy.
- Add a soft **scroll cue** (animated chevron) at the bottom.

### 2. Section dividers & rhythm
- Remove harsh `border-t border-border` between sections; replace with subtle gradient fade dividers (`bg-gradient-to-b from-transparent via-border/40 to-transparent` strip).
- Alternate section backgrounds: plain → soft tinted (`bg-secondary/30`) → plain, for visual rhythm.

### 3. Filter tips & feature cards
- Upgrade `Card` styling: add a faint top-edge gradient highlight (1px line), increase corner radius, deeper shadow on hover with primary-tinted glow.
- Number badge: pill with gradient fill + ring, slight 3D look.

### 4. Recommended / Trending headings
- Add small accent line (4-wide gradient bar) above each section title for editorial feel.

### 5. New utility classes (`src/index.css`)
- `.mesh-gradient` — animated 3-blob background (keyframes 20s ease-in-out infinite).
- `.aurora-text` — animated hue-rotating gradient for the highlighted hero word.
- `.dot-grid` — SVG background pattern utility.
- `.divider-fade` — gradient hairline divider.
- New keyframes: `mesh-drift`, `aurora-shift`, `scroll-bounce`.

### 6. Font setup
- `bun add @fontsource/space-grotesk`
- Import `@fontsource/space-grotesk/500.css`, `/600.css`, `/700.css` in `src/main.tsx`.
- Add `display: ['Space Grotesk', 'sans-serif']` to `tailwind.config.ts` fontFamily.

## Out of scope
- No changes to Navbar (already glass-styled and recently refined).
- No data/RLS/route/auth changes.
- No new sections; no stats/community/activity (per Core memory constraints).
- Other pages untouched — focus is the homepage where the user is right now.

## QA
- After build, check the homepage at desktop (1329px) and mobile widths; verify hero animations don't jank and that text remains legible in light + dark modes.
