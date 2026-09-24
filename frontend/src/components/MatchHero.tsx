import { useState } from "react";
import { DataEdge, points } from "../edge";
import { TeamId, TeamStats } from "../types";
import { FormPills } from "./FormPills";
import { TeamCrest } from "./TeamCrest";
import { TeamName } from "./TeamName";

interface Props {
  competitionName: string;
  competition: string;
  teamA: TeamStats;
  teamB: TeamStats;
  teamAId: TeamId;
  teamBId: TeamId;
  /** Open a club's dashboard from a hero name (standings-flavoured names). */
  onOpenTeam: (name: string, standingsId: TeamId) => void;
  edge: DataEdge;
  /** Actual final score when opened from a finished fixture — shown center-hero. */
  result?: { homeScore: number; awayScore: number; date: string };
}

const ANCHORS = [
  ["compare-prediction", "Prediction"],
  ["compare-stats", "Stats"],
  ["compare-lineups", "Lineups"],
  ["compare-h2h", "Head-to-head"],
  ["compare-chart", "Ratings"],
  ["compare-news", "News"],
] as const;

function jump(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

function TeamBlock({
  team,
  teamId,
  seriesColor,
  align,
  muted,
  competition,
  onOpenTeam,
}: {
  team: TeamStats;
  teamId: TeamId;
  seriesColor: string;
  align: "start" | "end";
  /** Trailing side: name steps back, crest and numbers stay full. */
  muted: boolean;
  competition: string;
  onOpenTeam: (name: string, standingsId: TeamId) => void;
}) {
  const alignClass = align === "end" ? "items-end text-right" : "items-start text-left";
  return (
    <div className={`flex flex-1 flex-col gap-2 min-w-0 ${alignClass}`}>
      <div className={`flex items-center gap-2.5 ${align === "end" ? "flex-row-reverse" : ""}`}>
        <TeamCrest name={team.name} crestColor={team.crestColor} competition={competition} size={32} />
        <TeamName
          onOpen={() => onOpenTeam(team.name, teamId)}
          title={`${team.name} — open team dashboard`}
          className={`text-lg font-bold truncate ${muted ? "text-[var(--text-2)]" : "text-[var(--text)]"}`}
        >
          {team.name}
        </TeamName>
      </div>
      <div
        className={`flex items-center gap-2 text-xs text-[var(--text-2)] ${
          align === "end" ? "flex-row-reverse" : ""
        }`}
      >
        <span
          className="inline-flex items-center gap-1.5 font-semibold"
          style={{ color: "var(--text)" }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: seriesColor }} />
          #{team.standingPosition}
        </span>
        <span className="text-[var(--muted)]">·</span>
        <span>{points(team)} pts</span>
      </div>
      <FormPills form={team.form} align={align} />
    </div>
  );
}

/**
 * Verdict header: matchup, data edge and wayfinding in one card. The edge
 * value in the middle carries the verdict (leader-colored, strength-labeled)
 * with the top reasons beneath; anchor chips stick on desktop so the long
 * evidence scroll stays reachable.
 */
export function MatchHero({ competitionName, competition, teamA, teamB, teamAId, teamBId, onOpenTeam, edge, result }: Props) {
  const leaderName =
    edge.leader === "A" ? teamA.name : edge.leader === "B" ? teamB.name : null;
  const v = Math.round(edge.value);
  const valueLabel = v === 0 ? "0" : v > 0 ? `+${v}` : `${v}`;
  const call = leaderName ? `${leaderName} to win` : "Too close to call";
  return (
    <div className="tl-card p-5">
      <h1 className="sr-only">
        {teamA.name} versus {teamB.name}, {competitionName}
      </h1>
      <div className="text-center text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">
        {competitionName}
      </div>
      <div className="flex items-start gap-3">
        <TeamBlock
          team={teamA}
          teamId={teamAId}
          seriesColor="var(--team-a)"
          align="start"
          muted={edge.leader === "B"}
          competition={competition}
          onOpenTeam={onOpenTeam}
        />
        {result && (
          <div
            className="flex flex-col items-center px-2 pt-1"
            aria-label={`Full-time score ${teamA.name} ${result.homeScore}, ${teamB.name} ${result.awayScore}`}
          >
            <span aria-hidden="true" className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--text)" }}>
              {result.homeScore}–{result.awayScore}
            </span>
            <span aria-hidden="true" className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
              Full-time
            </span>
          </div>
        )}
        <TeamBlock
          team={teamB}
          teamId={teamBId}
          seriesColor="var(--team-b)"
          align="end"
          muted={edge.leader === "A"}
          competition={competition}
          onOpenTeam={onOpenTeam}
        />
      </div>
      <p className="mt-3 text-center text-base font-extrabold text-[var(--text)]">
        {call}
        <span
          className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 align-middle text-[0.7rem] font-bold uppercase tracking-wide"
          style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
        >
          {edge.leader ? edge.strength : "Even"}
        </span>
      </p>
      <p className="mt-1 text-center text-xs leading-relaxed text-[var(--text-2)]">
        Data edge {valueLabel} · {edge.reasons.join(" · ")}
      </p>
    </div>
  );
}

/**
 * Wayfinding for the evidence scroll. Rendered as a sibling after the hero
 * (not inside it) so desktop stickiness spans the whole report — sticky only
 * constrains an element to its parent, and the card is short. Desktop-only
 * stickiness: the mobile header wraps taller than the 80px offset, so a
 * stuck bar would slide underneath it.
 */
export function HeroAnchors({ showPrediction = true }: { showPrediction?: boolean }) {
  const [current, setCurrent] = useState<string | null>(null);
  const anchors = showPrediction ? ANCHORS : ANCHORS.filter(([id]) => id !== "compare-prediction");
  return (
    <nav
      aria-label="Report sections"
      className="tl-card z-10 flex gap-1 overflow-x-auto px-3 py-2 lg:sticky"
      style={{ top: "80px", boxShadow: "0 1px 0 0 var(--border)" }}
    >
      {anchors.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            setCurrent(id);
            jump(id);
          }}
          aria-current={current === id ? "location" : undefined}
          className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold transition hover:bg-[var(--surface-2)]"
          style={{
            borderColor: current === id ? "var(--brand)" : "var(--border)",
            color: current === id ? "var(--text)" : "var(--text-2)",
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
