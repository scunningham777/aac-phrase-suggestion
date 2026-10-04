import { useEffect, useRef } from "react";
import type { SuggestionState } from "@/lib/useSuggestions";
import styles from "./SuggestionBar.module.css";

interface SuggestionBarProps extends SuggestionState {
  onSelect: (phrase: string) => void;
}

export default function SuggestionBar({ suggestions, loading, error, onSelect }: SuggestionBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  // The chip that last had keyboard focus, so focus can be put back if a new
  // set of suggestions removes it.
  const focusedChip = useRef<{ el: HTMLElement; index: number } | null>(null);

  useEffect(() => {
    const prev = focusedChip.current;
    if (!prev || prev.el.isConnected) return;
    focusedChip.current = null;
    if (document.activeElement && document.activeElement !== document.body) return;
    const chips = barRef.current?.querySelectorAll<HTMLElement>("button");
    const target = chips?.length ? chips[Math.min(prev.index, chips.length - 1)] : barRef.current;
    target?.focus();
  });

  let status: string | null = null;
  if (error) status = "Suggestions unavailable";
  else if (loading && suggestions.length === 0) status = "Thinking…";

  let announcement = "";
  if (error) announcement = "Suggestions unavailable";
  else if (!loading && suggestions.length) {
    announcement = `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"}`;
  }

  return (
    <div
      ref={barRef}
      className={styles.bar}
      aria-label="Suggested next words"
      role="group"
      tabIndex={-1}
    >
      <span className="sr-only" role="status">
        {announcement}
      </span>
      {status && (
        <span className={styles.status} aria-hidden="true">
          {status}
        </span>
      )}
      {suggestions.map((s, i) => (
        <button
          // Keyed by position so a focused chip keeps its element (and focus)
          // when the next set of suggestions arrives.
          key={i}
          type="button"
          className={styles.chip}
          // Stale chips stay visible (no layout jump) but can't be used – they
          // were suggested for an earlier version of the message.
          aria-disabled={loading}
          onClick={loading ? undefined : () => onSelect(s)}
          onFocus={(e) => (focusedChip.current = { el: e.currentTarget, index: i })}
          onBlur={(e) => {
            const el = e.currentTarget;
            // Blur from a removed chip leaves it disconnected; keep the record
            // then so the effect above can restore focus.
            queueMicrotask(() => {
              if (el.isConnected && focusedChip.current?.el === el) focusedChip.current = null;
            });
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
