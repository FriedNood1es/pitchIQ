import { NewsItem } from "../types";

interface Props {
  teamAName: string;
  teamBName: string;
  teamANews: NewsItem[];
  teamBNews: NewsItem[];
}

/** Handles both ISO timestamps (live feed) and date-only strings (mocks). */
function formatWhen(publishedAt: string): string {
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
          <span className="mr-1.5 text-xs text-[var(--muted)]">𝕏</span>
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

export function NewsList({ teamAName, teamBName, teamANews, teamBNews }: Props) {
  return (
    <details className="tl-card px-5 py-4" open>
      <summary className="tl-card-title cursor-pointer">Latest News</summary>
      <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <NewsColumn teamName={teamAName} seriesColor="var(--team-a)" items={teamANews} />
        <NewsColumn teamName={teamBName} seriesColor="var(--team-b)" items={teamBNews} />
      </div>
    </details>
  );
}
