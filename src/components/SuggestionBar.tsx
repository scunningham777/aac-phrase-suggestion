import type { SuggestionState } from "@/lib/useSuggestions";
import styles from "./SuggestionBar.module.css";

interface SuggestionBarProps extends SuggestionState {
  onSelect: (phrase: string) => void;
}

export default function SuggestionBar({ suggestions, loading, error, onSelect }: SuggestionBarProps) {
  let status: string | null = null;
  if (error) status = "Suggestions unavailable";
  else if (loading && suggestions.length === 0) status = "Thinking…";

  return (
    <div className={styles.bar} aria-label="Suggested next words" role="group" aria-busy={loading}>
      {status && <span className={styles.status}>{status}</span>}
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          className={styles.chip}
          // Stale chips stay visible (no layout jump) but can't be tapped –
          // they were suggested for an earlier version of the message.
          disabled={loading}
          onClick={() => onSelect(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
