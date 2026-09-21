/** Shared date labels — one copy instead of one per panel. */

/** "Today" / "Tomorrow" / "Yesterday", else "Saturday, September 20". */
export function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** "2026-09-21" in local time — value format for <input type="date">. */
export function toInputDate(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Parse an <input type="date"> value as local midnight (new Date("2026-09-21") is UTC and shifts the day). */
export function fromInputDate(v: string): Date {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "20 Sep 2026" — compact date for past meetings. */
export function formatDateShort(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "Sat, 20 Sep, 3:00 PM" — kickoff stamp for preview headers. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Relative age ("5m ago") for feed timestamps; falls back to "20 Sep". */
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
