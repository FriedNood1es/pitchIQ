import { ReactNode, useEffect, useId, useRef, useState } from "react";

export interface SelectOption {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface Props {
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  /** Accessible name for the control. */
  label: string;
  className?: string;
  /** Compact size for tight contexts like the sticky compare bar. */
  size?: "sm" | "md";
}

/**
 * Dropdown that can show an icon beside each option — a native <select>
 * renders only text, which is why this exists. Keyboard driven
 * (arrows/Home/End/Enter/Escape plus type-ahead) and closes on outside click.
 */
export function IconSelect({
  options,
  value,
  onChange,
  disabled,
  label,
  className = "",
  size = "md",
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeAhead = useRef({ query: "", at: 0 });

  const selected = options.find((o) => o.id === value);
  const selectedIndex = options.findIndex((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Keep the highlighted row in view as the user arrows through the list.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelectorAll("li")
      [activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function openList() {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function commit(index: number) {
    const option = options[index];
    if (option) onChange(option.id);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(activeIndex);
        return;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        return;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        return;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        return;
    }

    // Type-ahead: consecutive letters build a prefix, pauses reset it.
    if (e.key.length === 1 && /\S/.test(e.key)) {
      const now = Date.now();
      const state = typeAhead.current;
      state.query = now - state.at > 800 ? e.key : state.query + e.key;
      state.at = now;

      const match = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(state.query.toLowerCase())
      );
      if (match >= 0) setActiveIndex(match);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        className={`tl-field flex w-full items-center gap-2 text-left disabled:opacity-50 ${
          size === "sm" ? "px-2.5 py-1.5 text-[0.82rem]" : ""
        }`}
      >
        {selected?.icon}
        <span className="min-w-0 flex-1 truncate">
          {selected?.label ?? "Select…"}
        </span>
        <span aria-hidden="true" className="text-[var(--muted)]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 4.5 6 7.5 9 4.5" />
          </svg>
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${listId}-opt-${activeIndex}`}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-2)] py-1 shadow-xl"
        >
          {options.map((option, i) => (
            <li
              key={option.id}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={option.id === value}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => commit(i)}
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm"
              style={{
                background: i === activeIndex ? "var(--surface-3)" : undefined,
                color: option.id === value ? "var(--text)" : "var(--text-2)",
                fontWeight: option.id === value ? 600 : 400,
              }}
            >
              {option.icon}
              <span className="truncate">{option.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
