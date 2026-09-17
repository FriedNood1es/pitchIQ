import { NewsItem } from "../types";

interface Props {
  teamAName: string;
  teamBName: string;
  teamANews: NewsItem[];
  teamBNews: NewsItem[];
}

/** Handles both ISO timestamps (live feed) and date-only strings (mocks). */
export function formatWhen(publishedAt: string): string {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return publishedAt;

  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  if (minutes < 60 * 24 * 7) return `${Math.round(minutes / (60 * 24))}d ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function NewsEntry({ item }: { item: NewsItem }) {
  const meta = [item.source, formatWhen(item.publishedAt)]
    .filter(Boolean)
    .join(" · ");

  const body = (
    <>
      <p className="font-medium text-[var(--text)]">
        {item.kind === "tweet" && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="mr-1.5 inline-block align-baseline text-[var(--muted)]">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" />
          </svg>
        )}
        {item.headline}
      </p>
      {item.summary && <p className="text-[var(--text-2)]">{item.summary}</p>}
      <p className="mt-0.5 text-xs text-[var(--muted)]">{meta}</p>
    </>
  );

  return (
    <li
      className="border-l pl-3 text-sm"
      style={{ borderColor: "var(--border)" }}
    >
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-opacity hover:opacity-80"
        >
          {body}
        </a>
      ) : (
        body
      )}
    </li>
  );
}

function NewsColumn({
  teamName,
  seriesColor,
  items,
}: {
  teamName: string;
  seriesColor: string;
  items: NewsItem[];
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 font-semibold text-[var(--text)]">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: seriesColor }} />
        {teamName}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No recent news.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <NewsEntry key={item.url ?? i} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Open by default when anything is fresh (under 48h) — stale-only feeds stay shut. */
const FRESH_MS = 48 * 60 * 60 * 1000;
function isFresh(publishedAt: string): boolean {
  const t = new Date(publishedAt).getTime();
  return !Number.isNaN(t) && Date.now() - t < FRESH_MS;
}

export function NewsList({ teamAName, teamBName, teamANews, teamBNews }: Props) {
  const top = [...teamANews, ...teamBNews].find((i) => i.headline);
  const hasFresh = [...teamANews, ...teamBNews].some((i) => isFresh(i.publishedAt));
  return (
    <details className="tl-card px-5 py-4" open={hasFresh}>
      <summary className="cursor-pointer">
        <span className="tl-card-title">
          Latest News{" "}
          <span className="font-extrabold tabular-nums">
            ({teamANews.length} · {teamBNews.length})
          </span>
        </span>
        {top && (
          <span className="mt-1 block truncate text-sm font-medium normal-case tracking-normal text-[var(--text-2)]">
            {top.headline}{" "}
            <span className="text-xs text-[var(--muted)]">· {formatWhen(top.publishedAt)}</span>
          </span>
        )}
      </summary>
      <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <NewsColumn teamName={teamAName} seriesColor="var(--team-a)" items={teamANews} />
        <NewsColumn teamName={teamBName} seriesColor="var(--team-b)" items={teamBNews} />
      </div>
    </details>
  );
}
