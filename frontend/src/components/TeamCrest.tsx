interface Props {
  name: string;
  crestColor: string;
  size?: number;
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
export function TeamCrest({ name, crestColor, size = 22 }: Props) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
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
    </span>
  );
}
