/**
 * FIX 2 — Custom cursor gated on matchMedia during RENDER (AppShell / tweak shell)
 *
 * BROKEN (from production bundle layout chunk):
 *   const canUseCursor =
 *     tweaks.show_cursor &&
 *     window.matchMedia("(hover: hover) and (pointer: fine)").matches;
 *   return (
 *     <>
 *       {canUseCursor && <CustomCursor />}
 *       ...
 *     </>
 *   );
 *
 * Why it breaks: SSR HTML has no cursor node; desktop clients insert one →
 * React hydration error #418 ("server rendered HTML didn't match the client").
 * Combined with `body { cursor: none }` in CSS, a bad hydrate can leave the
 * pointer invisible (feels like the site "didn't load" in Firefox).
 *
 * APPLY: never read matchMedia during render. Use useSyncExternalStore
 * (preferred) or useState(false) + useEffect.
 */

"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

const FINE_POINTER_MQ = "(hover: hover) and (pointer: fine)";

function subscribeFinePointer(onStoreChange: () => void) {
  const mq = window.matchMedia(FINE_POINTER_MQ);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getFinePointerSnapshot() {
  return window.matchMedia(FINE_POINTER_MQ).matches;
}

/** Always false on the server so SSR HTML matches the first client pass. */
function getFinePointerServerSnapshot() {
  return false;
}

export function useFinePointerHover() {
  return useSyncExternalStore(
    subscribeFinePointer,
    getFinePointerSnapshot,
    getFinePointerServerSnapshot,
  );
}

/**
 * Replace the broken render-time matchMedia gate with this.
 * `showCursor` is your existing tweak flag (default true).
 */
export function CursorGate({
  showCursor,
  children,
}: {
  showCursor: boolean;
  children: ReactNode;
}) {
  const finePointer = useFinePointerHover();
  if (!showCursor || !finePointer) return null;
  return children;
}

/** Keep body cursor style updates in an effect (already mostly done — keep it there). */
export function useBodyCursorStyle(showCursor: boolean) {
  const finePointer = useFinePointerHover();
  useEffect(() => {
    document.body.style.cursor = showCursor && finePointer ? "none" : "auto";
  }, [showCursor, finePointer]);
}

/**
 * Minimal drop-in for the tweak shell return:
 *
 *   const finePointer = useFinePointerHover();
 *   useBodyCursorStyle(t.show_cursor);
 *   return (
 *     <>
 *       {t.show_cursor && finePointer ? <CustomCursor /> : null}
 *       <Nav />
 *       <Curtain />
 *       <main className="page-shell" key={pathname}>{children}</main>
 *       <TweakPanel ... />
 *     </>
 *   );
 */

/** Alternative if you prefer not to use useSyncExternalStore yet: */
export function useFinePointerHoverEffect() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(FINE_POINTER_MQ);
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return fine;
}
