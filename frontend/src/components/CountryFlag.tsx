interface Props {
  country: string;
  width?: number;
}

/**
 * Flags are drawn as inline SVG rather than emoji: Windows ships no country
 * flag glyphs, so 🇪🇸 renders as the letters "ES" there. Only the countries
 * in data/competitions.ts are needed.
 */
function FlagShape({ country }: { country: string }) {
  switch (country) {
    case "England":
      return (
        <>
          <rect width="3" height="2" fill="#fff" />
          <path d="M1.3 0h.4v2h-.4z M0 .8h3v.4H0z" fill="#CE1124" />
        </>
      );
    case "Spain":
      return (
        <>
          <rect width="3" height="2" fill="#AA151B" />
          <rect y="0.5" width="3" height="1" fill="#F1BF00" />
        </>
      );
    case "Italy":
      return (
        <>
          <rect width="1" height="2" fill="#008C45" />
          <rect x="1" width="1" height="2" fill="#F4F5F0" />
          <rect x="2" width="1" height="2" fill="#CD212A" />
        </>
      );
    case "Germany":
      return (
        <>
          <rect width="3" height="2" fill="#000" />
          <rect y="0.667" width="3" height="0.667" fill="#DD0000" />
          <rect y="1.333" width="3" height="0.667" fill="#FFCE00" />
        </>
      );
    case "France":
      return (
        <>
          <rect width="1" height="2" fill="#002654" />
          <rect x="1" width="1" height="2" fill="#fff" />
          <rect x="2" width="1" height="2" fill="#CE1126" />
        </>
      );
    case "Netherlands":
      return (
        <>
          <rect width="3" height="2" fill="#AE1C28" />
          <rect y="0.667" width="3" height="0.667" fill="#fff" />
          <rect y="1.333" width="3" height="0.667" fill="#21468B" />
        </>
      );
    case "Portugal":
      return (
        <>
          <rect width="1.2" height="2" fill="#046A38" />
          <rect x="1.2" width="1.8" height="2" fill="#DA291C" />
          {/* Armillary sphere, simplified to a dot at ~22px. */}
          <circle cx="1.2" cy="1" r="0.42" fill="#FFE900" />
        </>
      );
    case "Europe":
      return (
        <>
          <rect width="3" height="2" fill="#003399" />
          {/* Real stars are sub-pixel at ~22px wide; dots read as the ring. */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={1.5 + Math.cos(angle) * 0.55}
                cy={1 + Math.sin(angle) * 0.55}
                r="0.12"
                fill="#FFCC00"
              />
            );
          })}
        </>
      );
    default:
      return <rect width="3" height="2" fill="var(--surface-3)" />;
  }
}

export function CountryFlag({ country, width = 22 }: Props) {
  return (
    <svg
      viewBox="0 0 3 2"
      width={width}
      height={(width * 2) / 3}
      role="img"
      aria-label={country}
      className="shrink-0 rounded-[3px]"
    >
      <FlagShape country={country} />
      {/* Without an edge, white-field flags (England, Italy, France) dissolve
          into the light theme's surface. A mid grey reads on both themes. */}
      <rect
        x="0.03"
        y="0.03"
        width="2.94"
        height="1.94"
        rx="0.06"
        fill="none"
        stroke="var(--border)"
        strokeWidth="0.13"
      />
    </svg>
  );
}
