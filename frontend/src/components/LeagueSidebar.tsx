import { useFavoriteTeams } from "../hooks/useFavoriteTeams";
import { usePinnedLeagues } from "../hooks/usePinnedLeagues";
import { Competition, TeamSearchResult } from "../types";
import { CountryFlag } from "./CountryFlag";
import { TeamCrest } from "./TeamCrest";

interface Props {
  competitions: Competition[];
  /** Empty string = all leagues. */
  competition: string;
  onCompetitionChange: (competition: string) => void;
  onSelectTeam: (team: TeamSearchResult) => void;
}

/** Flashscore-style league rail: desktop only (mobile keeps the chips row). */
export function LeagueSidebar({
  competitions,
  competition,
  onCompetitionChange,
  onSelectTeam,
}: Props) {
  const [pinned, togglePin] = usePinnedLeagues();
  const [favorites] = useFavoriteTeams();
  const pinnedSet = new Set(pinned);
  const pinnedComps = competitions.filter((c) => pinnedSet.has(c.id));
  const rest = competitions.filter((c) => !pinnedSet.has(c.id));

  function leagueRow(id: string, name: string, country: string) {
    const active = competition === id;
    const isPinned = pinnedSet.has(id);
    return (
      <div
        key={id || "all"}
        className="flex items-center gap-0.5 rounded-lg transition hover:bg-[var(--surface-2)]"
        style={active ? { background: "var(--surface-2)" } : undefined}
      >
        <button
          type="button"
          onClick={() => onCompetitionChange(id)}
          aria-pressed={active}
          title={id ? `Show ${name} matches` : "Show matches from all leagues"}
          className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1 text-left"
        >
          {country ? <CountryFlag country={country} width={18} /> : null}
          <span
            className="truncate text-sm font-semibold"
            style={{ color: active ? "var(--text)" : "var(--text-2)" }}
          >
            {name}
          </span>
        </button>
        {id && (
          <button
            type="button"
            onClick={() => togglePin(id)}
            aria-pressed={isPinned}
            aria-label={`${isPinned ? "Unpin" : "Pin"} ${name}`}
            title={`${isPinned ? "Unpin" : "Pin"} ${name}`}
            className="shrink-0 rounded-md p-1.5 transition hover:bg-[var(--surface-3)]"
            style={{ color: isPinned ? "var(--brand)" : "var(--muted)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 3h8l-1 8 3 3v2H6v-2l3-3z" />
              <path d="M12 16v5" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <aside className="tl-card hidden w-60 shrink-0 space-y-1 p-2 lg:block" aria-label="Leagues and teams">
      {favorites.length > 0 && (
        <>
          <p className="tl-card-title px-2 pb-1 pt-1">My teams</p>
          {favorites.map((f) => (
            <button
              key={`${f.competition}/${f.id}`}
              type="button"
              onClick={() => onSelectTeam(f)}
              title={`${f.name} — open team dashboard`}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-[var(--surface-2)]"
            >
              <TeamCrest name={f.name} crestColor={f.crestColor} size={20} />
              <span className="truncate text-sm font-semibold text-[var(--text-2)]">
                {f.name}
              </span>
              <span className="ml-auto shrink-0">
                <CountryFlag country={f.country} width={16} />
              </span>
            </button>
          ))}
        </>
      )}
      {leagueRow("", "All leagues", "")}
      {pinnedComps.length > 0 && (
        <p className="tl-card-title px-2 pb-1 pt-3">Pinned leagues</p>
      )}
      {pinnedComps.map((c) =>
        leagueRow(c.id, c.name, c.country)
      )}
      {pinnedComps.length > 0 && (
        <p className="tl-card-title px-2 pb-1 pt-3">All leagues</p>
      )}
      {rest.map((c) =>
        leagueRow(c.id, c.name, c.country)
      )}
    </aside>
  );
}
