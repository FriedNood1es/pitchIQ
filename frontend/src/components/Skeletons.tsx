/** A shimmer bar inside a loading card. */
function Bar({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`tl-skeleton ${className}`} style={style} />;
}

/** One card-shaped skeleton mirroring a report section. */
function Section({ rows = 3 }: { rows?: number }) {
  return (
    <div className="tl-card p-5">
      <Bar className="h-3 w-24" />
      <div className="mt-3 space-y-2.5">
        {Array.from({ length: rows }, (_, i) => (
          <Bar key={i} style={{ width: `${82 - i * 9}%` }} className="h-4" />
        ))}
      </div>
    </div>
  );
}

/** Full-page placeholder shown while a comparison is in flight. */
export function ReportSkeleton() {
  return (
    <div className="space-y-5">
      <div className="tl-card p-5">
        <Bar className="mx-auto h-3 w-28" />
        <div className="mt-4 flex items-center justify-between">
          <Bar className="h-10 w-32" />
          <Bar className="h-4 w-8" />
          <Bar className="h-10 w-32" />
        </div>
      </div>
      <Section rows={6} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Section rows={5} />
        <Section rows={5} />
      </div>
    </div>
  );
}
