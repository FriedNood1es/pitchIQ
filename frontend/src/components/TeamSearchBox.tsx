import { useEffect, useRef, useState } from "react";
import { useSearch } from "../hooks/useSearch";
import { TeamSearchResult } from "../types";
import { CountryFlag } from "./CountryFlag";
import { TeamCrest } from "./TeamCrest";

interface Props {
  onSelect: (team: TeamSearchResult) => void;
}

/**
 * Global team search box for the header. Debounces input, shows a dropdown of
 * matches (monogram + name + competition), and reports the picked team up.
 */
export function TeamSearchBox({ onSelect }: Props) {
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), 250);
    return () => window.clearTimeout(id);
  }, [value]);

  const { data: results, isFetching } = useSearch(debounced);
  const showResults = open && debounced.trim().length >= 2;
  const showHint = open && value.trim().length === 1;

  // Close when clicking anywhere outside the widget.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  function select(team: TeamSearchResult) {
    setValue("");
    setDebounced("");
    setOpen(false);
    onSelect(team);
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        type="search"
        role="combobox"
        aria-expanded={showResults}
        aria-controls="team-search-listbox"
        aria-autocomplete="list"
        placeholder="Search teams (min. 2 chars)…"
        aria-label="Search teams"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-full max-w-[14rem] rounded-lg border px-3 py-1.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus-visible:border-[var(--brand)] sm:w-56 sm:max-w-none"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      />
      {showHint && (
        <p className="absolute right-0 top-full z-40 mt-1 rounded-xl border px-3 py-2 text-xs text-[var(--muted)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          Keep typing — need at least 2 characters.
        </p>
      )}
      {showResults && (
        <ul
          id="team-search-listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-auto rounded-xl border p-1 sm:left-auto sm:w-80"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          role="listbox"
        >
          {isFetching && !results && (
            <li className="px-3 py-2 text-sm text-[var(--muted)]">Searching…</li>
          )}
          {results && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-[var(--muted)]">No teams found — try the full club name.</li>
          )}
          {results?.map((r) => (
            <li key={`${r.competition}/${r.id}`}>
              <button
                type="button"
                role="option"
                onClick={() => select(r)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[var(--surface-2)]"
              >
                <TeamCrest
                  name={r.name}
                  crestColor={r.crestColor}
                  competition={r.competition}
                  size={20}
                />
                <span className="truncate text-sm font-semibold text-[var(--text)]">
                  {r.name}
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-[var(--muted)]">
                  <CountryFlag country={r.country} width={16} />
                  {r.competitionName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
