/**
 * FIX 3 (minor) — mosaic tile animationDelay float noise in SSR HTML
 *
 * BROKEN:
 *   style={{ animationDelay: 0.1 * index + "s" }}
 *   → serializes as "0.30000000000000004s" / "0.6000000000000001s"
 *
 * Safer:
 *   style={{ animationDelay: `${index * 100}ms` }}
 */

const HERO_TILES = [
  "HERO_01",
  "HERO_02",
  "HERO_03",
  "HERO_04",
  "HERO_05",
  "HERO_06",
  "HERO_07",
  "HERO_08",
] as const;

export function HeroMosaic() {
  return (
    <div className="hero__mosaic" aria-hidden>
      {HERO_TILES.map((id, index) => (
        <div
          key={id}
          className="tile"
          style={{ animationDelay: `${index * 100}ms` }}
        />
      ))}
    </div>
  );
}
