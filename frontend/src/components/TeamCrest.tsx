import { useState } from "react";
import { useCrestUrl } from "../crests";

interface Props {
  name: string;
  crestColor: string;
  size?: number;
  /** Competition id for ESPN badge resolution — omitted keeps the monogram. */
  competition?: string;
}

/** Club-type abbreviations carry no identity — "AFC Ajax" should read AJA, not AA. */
const CLUB_TYPE = /^(afc|fc|ac|as|sc|ss|ssc|sk|kv|cf|cd|ud|sd|rc|sv|us|vfl|vfb|tsg|psv)$/i;

/**
 * Initials for the monogram: one letter per word for multi-word clubs
 * ("Aston Villa" -> AV), otherwise the first three ("Arsenal" -> ARS).
 */
function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  // Keep the club-type token only if it is all the name has ("PSV").
  const meaningful = words.filter((w) => !CLUB_TYPE.test(w));
  const parts = meaningful.length ? meaningful : words;

  if (parts.length >= 2) {
    return parts
      .slice(0, 3)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  return (parts[0] ?? name).slice(0, 3).toUpperCase();
}

/**
 * BSD exposes no crest artwork, so every club renders as a colour monogram.
 * The crest colour comes from `crestColor` (a per-club brand accent, with a
 * neutral slate fallback for clubs outside the mapped set).
 */
export function TeamCrest({ name, crestColor, size = 22, competition }: Props) {
  // Real badge over the monogram: the initials stay mounted underneath, so
  // loading and failures degrade to the monogram with zero layout shift.
  // Single shared-store lookup — no per-row fetch or list merge.
  const url = useCrestUrl(competition, name);
  const [failed, setFailed] = useState(false);
  const [darkFailed, setDarkFailed] = useState(false);
  // ESPN's dark-variant artwork lives beside the default on the CDN. Derived
  // at render (no snapshot regen); a wrong pattern just fails back to the
  // default badge, never a broken frame.
  const darkUrl =
    url && !failed && url.includes("/teamlogos/soccer/500/")
      ? url.replace("/teamlogos/soccer/500/", "/teamlogos/soccer/500-dark/")
      : undefined;
  const imgStyle = {
    background: crestColor,
    objectFit: "contain",
    padding: "8%",
  } as const;
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-[var(--on-color)]"
      style={{
        width: size,
        height: size,
        background: crestColor,
        fontSize: Math.max(8, Math.round(size * 0.36)),
        // Dark club colours need an edge to separate them from the surface.
        boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.25)",
      }}
    >
      {initials(name)}
      {url && !failed && (
        <img
          src={url}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full"
          style={imgStyle}
        />
      )}
      {darkUrl && !darkFailed && (
        <img
          src={darkUrl}
          alt=""
          loading="lazy"
          onError={() => setDarkFailed(true)}
          className="crest-dark absolute inset-0 h-full w-full"
          style={imgStyle}
        />
      )}
    </span>
  );
}
