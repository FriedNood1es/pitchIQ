import { formatWhen } from "./NewsList";

interface Props {
  insight: string;
  generatedAt: string;
  generatedBy: "ai" | "template";
}

export function InsightPanel({ insight, generatedAt, generatedBy }: Props) {
  const label = generatedBy === "ai" ? "AI" : "Auto · data brief";
  return (
    <div className="tl-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide"
          style={{
            background: "var(--brand)",
            color: "var(--brand-ink)",
          }}
          title={
            generatedBy === "ai"
              ? "Written by a language model"
              : "Auto-generated from live data (no LLM key configured)"
          }
        >
          {label}
        </span>
        <h2 className="tl-card-title">Match Insight</h2>
      </div>
      <p
        className="border-l pl-4 text-[0.95rem] leading-relaxed text-[var(--text)]"
        style={{ borderColor: "var(--brand)" }}
      >
        {insight}
      </p>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Generated {formatWhen(generatedAt)}
      </p>
    </div>
  );
}
