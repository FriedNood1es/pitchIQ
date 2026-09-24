import { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { PreviewTeamSummary } from "../types";

/** Lowercase, strip diacritics (Málaga -> Malaga), keep [a-z0-9]. */
export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/**
 * Find a preview-list entry for a display name (standings rows and H2H carry
 * standings-flavoured names, the dashboard needs preview slugs). Tiers mirror
 * the backend's teamAgent and App's resolveTeam: exact -> normalized equality
 * -> one-directional containment. Never the reverse, which could match
 * "Wolverhampton" to an unrelated "Wolverhampton Casuals".
 */
export function matchPreviewTeam(
  list: PreviewTeamSummary[] | undefined,
  name: string
): PreviewTeamSummary | undefined {
  if (!list) return undefined;
  const exact = list.find((t) => t.name === name);
  if (exact) return exact;
  const norm = normalizeTeamName(name);
  return (
    list.find((t) => normalizeTeamName(t.name) === norm) ??
    list.find((t) => normalizeTeamName(t.name).includes(norm))
  );
}

/**
 * Clickable team name that opens the club's dashboard. A span with link
 * semantics — it lives inside row buttons where nesting a <button> is
 * invalid, so clicks/keys stop propagation and the row action never fires.
 * Tab-reachable (the lists' arrow-key roving focus covers buttons only).
 */
export function TeamName({
  onOpen,
  disabled,
  className = "",
  title = "Open team dashboard",
  children,
}: {
  /** Open the dashboard; not called while disabled. */
  onOpen: () => void;
  disabled?: boolean;
  className?: string;
  /** Defaults to "Open team dashboard" — truncated names pass the full name. */
  title?: string;
  children: ReactNode;
}) {
  function open(e: MouseEvent | KeyboardEvent) {
    e.stopPropagation();
    if ("key" in e && e.key === " ") e.preventDefault();
    if (disabled) return;
    onOpen();
  }
  return (
    <span
      role="link"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled ? "true" : undefined}
      title={title}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") open(e);
      }}
      // Space keyup bubbles to the parent row button, which would fire the
      // row action — swallow it (keydown was already handled above).
      onKeyUp={(e) => {
        if (e.key === " ") e.stopPropagation();
      }}
      className={`${className} rounded transition hover:text-[var(--brand)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--brand)]`}
    >
      {children}
    </span>
  );
}
