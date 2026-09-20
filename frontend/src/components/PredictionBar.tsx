import { formatWhen } from "./NewsList";
import { Prediction } from "../types";

interface Props {
  teamA: string;
  teamB: string;
  prediction: Prediction;
  /** "ai" when the LLM produced it, "template" for the deterministic model. */
  generatedBy: "ai" | "template";
  /** Narrative insight shown beneath the bar; falls back to key factor alone. */
  insight?: string;
  generatedAt?: string;
}

/**
 * Structured match prediction: a stacked win/draw/loss bar with the key
 * factor and narrative beneath. Team-tinted outer segments, neutral draw
 * middle — the same visual language as the hero's team colors.
 */
export function PredictionBar({ teamA, teamB, prediction, generatedBy, insight, generatedAt }: Props) {
  const { homeWin, draw, awayWin, confidence, keyFactor } = prediction;
  const label = generatedBy === "ai" ? "AI Prediction" : "Statistical Model";
  const confColor =
    confidence === "high"
      ? "var(--good)"
      : confidence === "medium"
        ? "var(--brand)"
        : "var(--muted)";
  return (
    <div id="compare-prediction" className="tl-card scroll-mt-24 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide"
          style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
          title={
            generatedBy === "ai"
              ? "Probabilities from a language model weighing live data"
              : "Probabilities from the deterministic model (no LLM key configured)"
          }
        >
          {label}
        </span>
        <h2 className="tl-card-title">Match Prediction</h2>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide"
          style={{ background: "var(--surface-3)", color: confColor }}
        >
          {confidence} confidence
        </span>
      </div>
      <div
        className="flex h-9 w-full overflow-hidden rounded-lg text-xs font-extrabold tabular-nums"
        role="img"
        aria-label={`${teamA} ${homeWin} percent, draw ${draw} percent, ${teamB} ${awayWin} percent`}
      >
        <div
          className="flex items-center justify-center px-2 text-[var(--on-color)]"
          style={{ width: `${homeWin}%`, background: "var(--team-a)" }}
        >
          {homeWin}%
        </div>
        <div
          className="flex items-center justify-center px-2 text-[var(--text-2)]"
          style={{ width: `${draw}%`, background: "var(--surface-3)" }}
        >
          {draw}%
        </div>
        <div
          className="flex items-center justify-center px-2 text-[var(--on-color)]"
          style={{ width: `${awayWin}%`, background: "var(--team-b)" }}
        >
          {awayWin}%
        </div>
      </div>
      <div className="mt-2 flex text-[0.7rem] font-bold">
        <span className="truncate" style={{ color: "var(--text)" }}>
          {teamA}
        </span>
        <span className="mx-auto shrink-0 px-2 text-[var(--muted)]">Draw</span>
        <span className="truncate text-right" style={{ color: "var(--text)" }}>
          {teamB}
        </span>
      </div>
      <p className="mt-3 border-l pl-4 text-[0.85rem] leading-relaxed text-[var(--text-2)]" style={{ borderColor: "var(--brand)" }}>
        Key factor: {keyFactor}
      </p>
      {insight && (
        <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--text)]">
          {insight}
        </p>
      )}
      {generatedAt && (
        <p className="mt-3 text-xs text-[var(--muted)]">
          Generated {formatWhen(generatedAt)}
        </p>
      )}
    </div>
  );
}
