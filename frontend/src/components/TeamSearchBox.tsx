import { useEffect, useId, useRef, useState } from "react";
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
 * Keyboard mirrors IconSelect: arrows/Home/End move, Enter commits, Escape
 * closes; the input owns aria-activedescendant over plain li options.
 */
export function TeamSearchBox({ onSelect }: Props) {
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), 250);
    return () => window.clearTimeout(id);
  }, [value]);

  const { data: results, isFetching } = useSearch(debounced);
  const showResults = open && debounced.trim().length >= 2;
  const showHint = open && value.trim().length === 1;

  // New result set — restart highlight at the top.
  useEffect(() => {
    setActive(0);
  }, [debounced, results]);

  // Keep the highlighted row in view. Instant like IconSelect: already
  // still under reduced motion by default.
  useEffect(() => {
    if (!showResults) return;
    listRef.current
      ?.querySelectorAll("[role='option']")
      [active]?.scrollIntoView({ block: "nearest" });
  }, [showResults, active]);

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

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      e.currentTarget.blur();
      return;
    }
    if (!showResults || !results || results.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(i + 1, results.length - 1));
        return;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        return;
      case "Home":
        e.preventDefault();
        setActive(0);
        return;
      case "End":
        e.preventDefault();
        setActive(results.length - 1);
        return;
      case "Enter": {
        const pick = results[Math.min(active, results.length - 1)];
        if (pick) {
          e.preventDefault();
          select(pick);
        }
      }
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        type="search"
        role="combobox"
        aria-expanded={showResults}
        aria-controls={listId}
        aria-activedescendant={showResults && results?.length ? `${listId}-opt-${active}` : undefined}
        aria-autocomplete="list"
        placeholder="Search teams (min. 2 chars)…"
        aria-label="Search teams"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
        className="w-full max-w-[14rem] rounded-[10px] border px-3 py-1.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus-visible:border-[var(--brand)] sm:w-56 sm:max-w-none"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      />
      {showHint && (
        <p className="absolute right-0 top-full z-40 mt-1 rounded-xl border px-3 py-2 text-xs text-[var(--muted)]" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          Keep typing — need at least 2 characters.
        </p>
      )}
      {showResults && (
        <ul
          id={listId}
          ref={listRef}
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-auto rounded-xl border p-1 sm:left-auto sm:w-80"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          role="listbox"
          aria-label="Matching teams"
        >
          {isFetching && !results && (
            <li className="px-3 py-2 text-sm text-[var(--muted)]">Searching…</li>
          )}
          {results && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-[var(--muted)]">No teams found — try the full club name.</li>
          )}
          {results?.map((r, i) => (
            <li
              key={`${r.competition}/${r.id}`}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => select(r)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-[var(--surface-2)]"
              style={i === active ? { background: "var(--surface-2)" } : undefined}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
