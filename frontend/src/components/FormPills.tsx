const COLOR: Record<string, string> = {
  W: "var(--good)",
  D: "var(--draw)",
  L: "var(--loss)",
};

interface Props {
  form: string[];
  align?: "start" | "end";
}

/** Recent results as colored W/D/L pills (letter carries meaning, not colour alone). */
export function FormPills({ form, align = "start" }: Props) {
  if (form.length === 0) {
    return <span className="text-xs text-[var(--muted)]">No recent form</span>;
  }
  return (
    <div className="flex gap-1" style={{ justifyContent: align === "end" ? "flex-end" : "flex-start" }}>
      {form.map((r, i) => (
        <span key={i} className="form-pill" style={{ background: COLOR[r] ?? "var(--draw)" }}>
          {r}
        </span>
      ))}
    </div>
  );
}
