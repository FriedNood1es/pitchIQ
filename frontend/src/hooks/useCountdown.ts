import { useEffect, useState } from "react";

/**
 * Time remaining until a target date. Ticks every second for matches within
 * the next hour, and every minute otherwise — a full fixtures list re-renders
 * each row at most once a minute, and only the few imminent matches tick per
 * second. Returns the remaining duration in ms (0 once reached).
 */
export function useCountdown(target: string | number | Date): number {
  const targetMs = new Date(target).getTime();
  const [remaining, setRemaining] = useState(() => targetMs - Date.now());

  useEffect(() => {
    const update = () => setRemaining(targetMs - Date.now());
    update();
    const imminent = targetMs - Date.now() <= 60 * 60 * 1000;
    const id = window.setInterval(update, imminent ? 1000 : 60_000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  return Math.max(0, remaining);
}

/** Current epoch ms, ticking on an interval. Used for live-match elapsed clocks. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Compact countdown label: "1d 4h" / "3h 24m" / "12m 30s" / "5s" / "KO". */
export function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return "KO";
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
