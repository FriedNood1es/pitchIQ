import { useEffect, useState } from "react";
import { CompareBar } from "./components/CompareBar";
import { FixturesView } from "./components/FixturesView";
import { HeadToHeadPanel } from "./components/HeadToHeadPanel";
import { InsightPanel } from "./components/InsightPanel";
import { LineupPanel } from "./components/LineupPanel";
import { MatchHero } from "./components/MatchHero";
import { NewsList } from "./components/NewsList";
import { RadarChart } from "./components/RadarChart";
import { ReportSkeleton } from "./components/Skeletons";
import { StatComparison, StatRow } from "./components/StatComparison";
import { TeamComparisonForm } from "./components/TeamComparisonForm";
import { TeamSearchBox } from "./components/TeamSearchBox";
import { TeamView } from "./components/TeamView";
import { useCompareTeams } from "./hooks/useCompareTeams";
import { useCompetitions } from "./hooks/useCompetitions";
import { useFixtures } from "./hooks/useFixtures";
import { useTeams } from "./hooks/useTeams";
import { useTheme } from "./hooks/useTheme";
import { parseHash, writeHash, ViewMode } from "./hash";
import { Fixture, FixturesStatus, TeamId, TeamSearchResult, TeamStats } from "./types";

/** Lowercase, strip diacritics (Málaga -> Malaga), keep [a-z0-9]. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/**
 * Resolve a fixture-side club name to a standings slug. Fixture names come
 * from the live season and standings from the pinned completed season, so they
 * differ in places (e.g. "Feyenoord Rotterdam" vs "Feyenoord"); matching falls
 * back exact -> normalized equality -> substring, mirroring the backend's
 * teamAgent tiers. Returns undefined when the club has no standings entry
 * (newly promoted, UCL qualifier) — the caller then routes to the team page.
 */
function resolveTeam(
  teams: { id: TeamId; name: string }[],
  name: string
): TeamId | undefined {
  const exact = teams.find((t) => t.name === name);
  if (exact) return exact.id;
  const norm = normalizeName(name);
  const normalized = teams.find((t) => normalizeName(t.name) === norm);
  if (normalized) return normalized.id;
  // One-directional, like the backend's teamAgent: a standings name containing
  // the fixture name ("Feyenoord Rotterdam" > "Feyenoord"). Never the reverse,
  // which could match "Wolverhampton" to an unrelated "Wolverhampton Casuals".
  return teams.find((t) => normalizeName(t.name).includes(norm))?.id;
}

function buildStatRows(a: TeamStats, b: TeamStats): StatRow[] {
  const pts = (t: TeamStats) => t.wins * 3 + t.draws;
  return [
    { label: "Points", a: pts(a), b: pts(b) },
    { label: "Attack", a: a.attackRating, b: b.attackRating },
    { label: "Defense", a: a.defenseRating, b: b.defenseRating },
    {
      label: "Possession",
      a: a.possessionAvg,
      b: b.possessionAvg,
      displayA: `${a.possessionAvg}%`,
      displayB: `${b.possessionAvg}%`,
    },
    { label: "Goals scored", a: a.goalsFor, b: b.goalsFor },
    { label: "Goals conceded", a: a.goalsAgainst, b: b.goalsAgainst },
  ];
}

function ThemeToggle({ theme, onToggle }: { theme: "dark" | "light"; onToggle: () => void }) {
  const toLight = theme === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={toLight ? "Switch to light theme" : "Switch to dark theme"}
      title={toLight ? "Light theme" : "Dark theme"}
      className="rounded-lg p-1.5 text-[var(--text-2)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
    >
      {toLight ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

export default function App() {
  const { data: competitions } = useCompetitions();
  // "" in fixtures mode means "all leagues"; compare needs a real one.
  const [competition, setCompetition] = useState("");
  const [mode, setMode] = useState<ViewMode>("fixtures");
  const [fixturesStatus, setFixturesStatus] = useState<FixturesStatus>("all");

  const { data: teams, isError: isTeamsError, error: teamsError, refetch: refetchTeams } =
    useTeams(competition);

  const [teamA, setTeamA] = useState<TeamId>("");
  const [teamB, setTeamB] = useState<TeamId>("");
  const [hasCompared, setHasCompared] = useState(false);

  // A match row clicked in the fixtures view waits for that league's standings
  // list to resolve the two clubs (fixtures carry preview slugs) before showing
  // the comparison. If a club can't resolve (newly promoted / qualifier), the
  // click falls through to that club's team dashboard instead of being dropped.
  const [pendingCompare, setPendingCompare] = useState<{
    competition: string;
    homeName: string;
    awayName: string;
    homeId: TeamId;
    awayId: TeamId;
  } | null>(null);

  // A team opened from the header search: competition + preview slug.
  const [teamSelection, setTeamSelection] = useState<{
    competition: string;
    team: TeamId;
  } | null>(null);

  // A selection requested via the URL hash, applied once its data is loaded.
  const [hashDraft, setHashDraft] = useState(() => parseHash());
  const { theme, toggle } = useTheme();

  // Apply a hash target: set mode + competition (fixtures applies immediately;
  // compare waits on its team list in the effect below).
  useEffect(() => {
    if (!hashDraft || !competitions || competitions.length === 0) return;
    if (hashDraft.mode === "fixtures") {
      const valid =
        !hashDraft.competition ||
        competitions.some((c) => c.id === hashDraft.competition);
      if (!valid) {
        setHashDraft(null);
        return;
      }
      setMode("fixtures");
      setCompetition(hashDraft.competition);
      setFixturesStatus(hashDraft.status);
      setHashDraft(null);
      return;
    }
    if (!competitions.some((c) => c.id === hashDraft.competition)) {
      setHashDraft(null);
      return;
    }
    setMode(hashDraft.mode);
    setCompetition(hashDraft.competition);
    setHasCompared(false);
    setTeamA("");
    setTeamB("");
    setTeamSelection(
      hashDraft.mode === "team"
        ? { competition: hashDraft.competition, team: hashDraft.team }
        : null
    );
    setHashDraft(null);
  }, [hashDraft, competitions]);

  // Apply a compare hash selection once that competition's teams are loaded.
  useEffect(() => {
    if (!hashDraft || hashDraft.mode !== "compare" || hashDraft.competition !== competition) return;
    if (!teams || teams.length < 2) return;

    if (teams.some((t) => t.id === hashDraft.teamA) && teams.some((t) => t.id === hashDraft.teamB)) {
      setTeamA(hashDraft.teamA);
      setTeamB(hashDraft.teamB);
      setHasCompared(true);
    } else {
      setTeamA(teams[0].id);
      setTeamB(teams[1].id);
    }
    setHashDraft(null);
  }, [hashDraft, competition, teams]);

  // Default the compare slots to the first two whenever they are empty.
  useEffect(() => {
    if (hashDraft) return;
    if (teams && teams.length >= 2) {
      setTeamA((a) => a || teams[0].id);
      setTeamB((b) => b || teams[1].id);
    }
  }, [hashDraft, teams]);

  // A match row clicked in the fixtures view: resolve the two clubs' standings
  // slugs (fixtures carry preview slugs) once the league's teams load. If a
  // club has no standings entry (newly promoted / UCL qualifier), the click
  // still lands somewhere — that club's team dashboard — instead of dropping.
  useEffect(() => {
    if (!pendingCompare) return;
    if (pendingCompare.competition !== competition) {
      setCompetition(pendingCompare.competition);
      return;
    }
    if (!teams || teams.length < 2) return;

    const homeId = resolveTeam(teams, pendingCompare.homeName);
    const awayId = resolveTeam(teams, pendingCompare.awayName);
    setPendingCompare(null);

    if (homeId && awayId) {
      setTeamA(homeId);
      setTeamB(awayId);
      setHasCompared(true);
      setMode("compare");
      writeHash({ mode: "compare", competition, teamA: homeId, teamB: awayId });
      return;
    }

    // Unresolvable club(s): open the dashboard of the one missing from the
    // standings (the away side when only it fails, else the home side), so the
    // click is never a dead end.
    const fallbackId = homeId ? pendingCompare.awayId : pendingCompare.homeId;
    setCompetition(pendingCompare.competition);
    setTeamSelection({
      competition: pendingCompare.competition,
      team: fallbackId,
    });
    setMode("team");
    writeHash({
      mode: "team",
      competition: pendingCompare.competition,
      team: fallbackId,
    });
  }, [pendingCompare, competition, teams]);

  // Keep the hash in sync with the current selection (back/forward restores it).
  useEffect(() => {
    if (hashDraft || mode !== "fixtures") return;
    writeHash({ mode: "fixtures", competition, status: fixturesStatus });
  }, [hashDraft, mode, competition, fixturesStatus]);

  useEffect(() => {
    if (mode === "compare" && hasCompared && competition && teamA && teamB) {
      writeHash({ mode: "compare", competition, teamA, teamB });
    }
  }, [mode, hasCompared, competition, teamA, teamB]);

  useEffect(() => {
    if (mode === "team" && teamSelection) {
      writeHash({
        mode: "team",
        competition: teamSelection.competition,
        team: teamSelection.team,
      });
    }
  }, [mode, teamSelection]);

  // Restore a selection when the hash changes (back/forward or manual edit).
  useEffect(() => {
    const onHash = () => {
      const parsed = parseHash();
      if (!parsed) return;
      const sameFixtures =
        parsed.mode === "fixtures" &&
        mode === "fixtures" &&
        parsed.competition === competition &&
        parsed.status === fixturesStatus;
      const sameCompare =
        parsed.mode === "compare" &&
        mode === "compare" &&
        parsed.competition === competition &&
        parsed.teamA === teamA &&
        parsed.teamB === teamB;
      const sameTeam =
        parsed.mode === "team" &&
        mode === "team" &&
        parsed.competition === competition &&
        parsed.team === teamSelection?.team;
      if (sameFixtures || sameCompare || sameTeam) return;
      setHashDraft(parsed);
      setMode(parsed.mode);
      setCompetition(parsed.competition);
      setTeamA("");
      setTeamB("");
      setHasCompared(false);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [competition, teamA, teamB, mode, fixturesStatus, teamSelection]);

  const canCompare = mode === "compare" && hasCompared && Boolean(teamA) && Boolean(teamB);

  const { data: compareData, isFetching, isError, error, refetch } = useCompareTeams(
    competition,
    teamA,
    teamB,
    canCompare
  );
  const {
    data: fixtures,
    isFetching: fixturesFetching,
    isError: fixturesError,
    error: fixturesErrorObj,
    refetch: refetchFixtures,
  } = useFixtures(
    mode === "fixtures" ? competition : "",
    mode === "fixtures" ? fixturesStatus : "all",
    mode === "fixtures"
  );

  function handleChangeCompetition(id: string) {
    setCompetition(id);
    setHasCompared(false);
    setTeamA("");
    setTeamB("");
  }

  function handleCompare() {
    setHasCompared(true);
    if (hasCompared) refetch();
  }

  function handleFixturesStatusChange(status: FixturesStatus) {
    setFixturesStatus(status);
  }

  function handleFixturesCompetitionChange(id: string) {
    setCompetition(id);
  }

  /** Any match row -> compare both clubs, once the league's standings resolve. */
  function handleNavigate(fixture: Fixture) {
    setPendingCompare({
      competition: fixture.competition,
      homeName: fixture.homeTeam.name,
      awayName: fixture.awayTeam.name,
      homeId: fixture.homeTeam.id,
      awayId: fixture.awayTeam.id,
    });
  }

  /** Search result -> the team's dashboard (Preview / Stats / Matches). */
  function handleSelectTeam(result: TeamSearchResult) {
    setHasCompared(false);
    setTeamA("");
    setTeamB("");
    setPendingCompare(null);
    setCompetition(result.competition);
    setTeamSelection({ competition: result.competition, team: result.id });
    setMode("team");
    writeHash({ mode: "team", competition: result.competition, team: result.id });
  }

  function handleBackToFixtures() {
    setTeamSelection(null);
    setMode("fixtures");
    setHasCompared(false);
    setTeamA("");
    setTeamB("");
  }

  /** Logo click -> the all-leagues fixtures homepage. */
  function handleHome() {
    setTeamSelection(null);
    setHasCompared(false);
    setTeamA("");
    setTeamB("");
    setCompetition("");
    setFixturesStatus("all");
    setMode("fixtures");
  }

  const report = canCompare && compareData ? compareData : undefined;
  const reportKey = report
    ? `${report.intent.competition}/${report.teams.teamA.stats.teamId}-${report.teams.teamB.stats.teamId}`
    : "";

  const competitionName =
    competitions?.find((c) => c.id === (report?.intent.competition ?? competition))?.name ?? "";

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30">
        <header
          className="px-4 py-4"
          style={{ background: "var(--surface)", borderBottom: "2px solid var(--brand)" }}
        >
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              onClick={handleHome}
              title="Back to homepage"
              className="text-xl font-extrabold tracking-tight text-[var(--text)] transition hover:opacity-80"
            >
              <span aria-hidden className="mr-1">⚽</span>Pitch
              <span style={{ color: "var(--brand)" }}>IQ</span>
            </button>
            <span className="text-sm font-medium text-[var(--muted)]">Data-backed football predictions</span>
            <span className="ml-auto">
              <TeamSearchBox onSelect={handleSelectTeam} />
            </span>
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        </header>
      </div>
      {mode === "compare" && canCompare && (
        <CompareBar
          competitions={competitions ?? []}
          competition={competition}
          teams={teams ?? []}
          teamA={teamA}
          teamB={teamB}
          onChangeCompetition={handleChangeCompetition}
          onChangeTeamA={setTeamA}
          onChangeTeamB={setTeamB}
          onCompare={handleCompare}
          isLoading={isFetching}
        />
      )}

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-6">
        {mode === "fixtures" && (
          <FixturesView
            fixtures={fixtures}
            isFetching={fixturesFetching}
            isError={fixturesError}
            error={fixturesErrorObj}
            onRetry={() => refetchFixtures()}
            status={fixturesStatus}
            onStatusChange={handleFixturesStatusChange}
            competitions={competitions ?? []}
            competition={competition}
            onCompetitionChange={handleFixturesCompetitionChange}
            onNavigate={handleNavigate}
          />
        )}

        {mode === "team" && teamSelection && (
          <TeamView
            competition={teamSelection.competition}
            team={teamSelection.team}
            competitionName={
              competitions?.find((c) => c.id === teamSelection.competition)?.name ?? ""
            }
            country={
              competitions?.find((c) => c.id === teamSelection.competition)?.country ?? ""
            }
            onBack={handleBackToFixtures}
            onNavigate={handleNavigate}
          />
        )}

        {mode === "compare" && !canCompare && (
          <TeamComparisonForm
            competitions={competitions ?? []}
            competition={competition}
            teams={teams ?? []}
            teamA={teamA}
            teamB={teamB}
            onChangeCompetition={handleChangeCompetition}
            onChangeTeamA={setTeamA}
            onChangeTeamB={setTeamB}
            onCompare={handleCompare}
            isLoading={isFetching}
          />
        )}

        {mode === "compare" && isTeamsError && (
          <div className="tl-card flex items-center justify-between gap-3 p-4 text-sm" style={{ color: "var(--loss)" }}>
            <span>Couldn't load teams: {(teamsError as Error).message}</span>
            <button
              className="rounded-[10px] px-3 py-1.5 text-xs font-bold"
              style={{ background: "var(--surface-3)", color: "var(--text)" }}
              onClick={() => refetchTeams()}
            >
              Retry
            </button>
          </div>
        )}

        {mode === "compare" && isError && (
          <div className="tl-card flex items-center justify-between gap-3 p-4 text-sm" style={{ color: "var(--loss)" }}>
            <span>{(error as Error).message}</span>
            <button
              className="rounded-[10px] px-3 py-1.5 text-xs font-bold"
              style={{ background: "var(--surface-3)", color: "var(--text)" }}
              onClick={handleCompare}
            >
              Retry
            </button>
          </div>
        )}

        {mode === "compare" && canCompare && isFetching && !report && <ReportSkeleton />}

        {report && (
          <div key={reportKey} className="space-y-5">
            {report.validationIssues.length > 0 && (
              <div className="tl-card border-l-4 p-4 text-sm" style={{ borderLeftColor: "var(--loss)" }}>
                <p className="font-semibold" style={{ color: "var(--loss)" }}>
                  Some data is incomplete
                </p>
                <ul className="mt-1 list-inside list-disc text-[var(--muted)]">
                  {report.validationIssues.map((issue, i) => (
                    <li key={i}>{issue.message}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="tl-reveal">
              <MatchHero
                competitionName={competitionName}
                teamA={report.teams.teamA.stats}
                teamB={report.teams.teamB.stats}
              />
            </div>
            <div className="tl-reveal tl-reveal-delay-1">
              <StatComparison
                rows={buildStatRows(report.teams.teamA.stats, report.teams.teamB.stats)}
                teamAName={report.teams.teamA.stats.name}
                teamBName={report.teams.teamB.stats.name}
              />
            </div>
            <div className="tl-reveal tl-reveal-delay-1">
              <LineupPanel
                teamAName={report.teams.teamA.stats.name}
                teamBName={report.teams.teamB.stats.name}
                teamALineup={report.teams.teamA.lineup}
                teamBLineup={report.teams.teamB.lineup}
                teamAInjuries={report.teams.teamA.injuries}
                teamBInjuries={report.teams.teamB.injuries}
              />
            </div>
            <div className="tl-reveal tl-reveal-delay-1">
              <HeadToHeadPanel
                headToHead={report.headToHead}
                teamA={report.intent.teamA}
                teamAName={report.teams.teamA.stats.name}
                teamBName={report.teams.teamB.stats.name}
              />
            </div>
            <div className="tl-reveal tl-reveal-delay-2">
              <InsightPanel
                insight={report.insight}
                generatedAt={report.generatedAt}
                generatedBy={report.insightGeneratedBy}
              />
            </div>
            <div className="tl-reveal tl-reveal-delay-3">
              <RadarChart
                labels={report.visualization.radar.labels}
                datasets={report.visualization.radar.datasets}
              />
            </div>
            <div className="tl-reveal tl-reveal-delay-4">
              <NewsList
                teamAName={report.teams.teamA.stats.name}
                teamBName={report.teams.teamB.stats.name}
                teamANews={report.news.teamA}
                teamBNews={report.news.teamB}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
