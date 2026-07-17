# Fix React hydration errors on gamechangers.vc (Firefox)

## Context

Visitors reported the Game Changers Ventures site (https://www.gamechangers.vc/) failing to load in Firefox due to hydration errors.

This was reproduced against production:

- **Error:** `Minified React error #418` — server-rendered HTML didn’t match the client
- Happens in **Firefox and Chromium**
- Vercel project name: `gcv-external-website`
- Stack: Next.js App Router + client components under `app/(frontend)/`

## Root causes (confirmed from production JS bundles)

### 1. Hero video `src` chosen with `window.matchMedia` inside `useState`

Search the codebase for: `hero-mobile.mp4`

Broken pattern (or equivalent):

```ts
const [src] = useState(() =>
  window.matchMedia("(max-width: 760px)").matches
    ? "/assets/hero-mobile.mp4"
    : "/assets/hero.mp4",
);
```

**Fix:**
- Default SSR + first paint to `"/assets/hero.mp4"`
- Switch to `"/assets/hero-mobile.mp4"` in `useEffect` (and listen for `matchMedia` `change`)
- Do **not** read `window` / `matchMedia` during render or in a `useState` initializer

### 2. Custom cursor gated on `window.matchMedia` during render

Search the codebase for: `show_cursor` and `matchMedia("(hover: hover) and (pointer: fine)")`

Broken pattern (or equivalent):

```ts
const canUseCursor =
  show_cursor &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

return (
  <>
    {canUseCursor && <CustomCursor />}
    {/* nav, main, etc. */}
  </>
);
```

**Fix:**
- Never call `matchMedia` during render
- Prefer `useSyncExternalStore` with a **server snapshot of `false`**, so SSR HTML has no cursor node and the first client pass matches
- Or: `useState(false)` + enable in `useEffect`
- Keep `document.body.style.cursor = ...` updates inside `useEffect` only

This matters because CSS sets `body { cursor: none }` — if the custom cursor fails to mount cleanly after a hydration error, the pointer can disappear and the site feels broken.

### 3. Optional cleanup — mosaic tile delays

Search for: `animationDelay` near hero mosaic tiles

Broken: `animationDelay: 0.1 * index + "s"` → `"0.30000000000000004s"` in HTML  
Safer: `animationDelay: \`${index * 100}ms\``

## What to do

1. Find and fix the two matchMedia hydration bugs above in this repo.
2. Keep existing behavior:
   - Desktop fine-pointer: custom cursor still works when enabled
   - Narrow viewports: mobile hero video still loads (after mount is fine)
3. Commit on a feature branch and open a PR.
4. Verify before finishing (required):
   - Load `/` in Firefox and Chrome
   - Desktop width and width `< 760px`
   - DevTools console must **not** show React error `#418` / hydration mismatch
   - Page content visible; custom cursor works on desktop with a mouse
   - Hard refresh still clean

## Do not

- Change copy, design, or CMS content
- Remove the custom cursor feature entirely
- “Fix” it with `suppressHydrationWarning` on large trees
- Leave any `window` / `document` / `matchMedia` reads in the render path for these components
