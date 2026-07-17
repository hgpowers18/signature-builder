/**
 * FIX 1 — Hero video src (HomePage / home page client component)
 *
 * BROKEN (from production bundle):
 *   const [src] = useState(() =>
 *     window.matchMedia("(max-width: 760px)").matches
 *       ? "/assets/hero-mobile.mp4"
 *       : "/assets/hero.mp4",
 *   );
 *
 * Why it breaks: useState initializer runs during SSR. `window` is unavailable /
 * differs from the client viewport, so hydrated markup mismatches (React #418).
 *
 * APPLY: replace the matchMedia useState with the pattern below.
 */

"use client";

import { useEffect, useRef, useState } from "react";

const DESKTOP_HERO = "/assets/hero.mp4";
const MOBILE_HERO = "/assets/hero-mobile.mp4";
const MOBILE_MQ = "(max-width: 760px)";

export function useHeroVideoSrc() {
  // Stable SSR + first client paint value — never read window during render.
  const [src, setSrc] = useState(DESKTOP_HERO);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setSrc(mq.matches ? MOBILE_HERO : DESKTOP_HERO);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return src;
}

/** Drop-in video element wiring (keeps existing mute/playsinline play bootstrap). */
export function HeroVideo() {
  const src = useHeroVideoSrc();
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");

    let cancelled = false;
    const tryPlay = () => {
      if (cancelled) return;
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
    };

    tryPlay();
    el.addEventListener("loadeddata", tryPlay);
    el.addEventListener("canplay", tryPlay);
    const unlock = ["touchstart", "touchend", "click", "pointerdown"] as const;
    unlock.forEach((evt) => window.addEventListener(evt, tryPlay, { passive: true }));
    document.addEventListener("visibilitychange", tryPlay);

    return () => {
      cancelled = true;
      el.removeEventListener("loadeddata", tryPlay);
      el.removeEventListener("canplay", tryPlay);
      unlock.forEach((evt) => window.removeEventListener(evt, tryPlay));
      document.removeEventListener("visibilitychange", tryPlay);
    };
  }, [src]);

  return (
    <div className="hero__video" aria-hidden>
      <video
        ref={ref}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        // @ts-expect-error vendor attrs used by existing site
        webkit-playsinline="true"
        x5-playsinline="true"
        disableRemotePlayback
        preload="metadata"
      />
      <div className="hero__video-overlay" />
    </div>
  );
}
