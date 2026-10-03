import styles from "./MessageBar.module.css";

interface MessageBarProps {
  tokens: string[];
  onSpeak: () => void;
  onBackspace: () => void;
  onClear: () => void;
}

export default function MessageBar({ tokens, onSpeak, onBackspace, onClear }: MessageBarProps) {
  const empty = tokens.length === 0;

  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.message}
        onClick={onSpeak}
        disabled={empty}
        aria-label={empty ? "Message is empty" : `Speak message: ${tokens.join(" ")}`}
      >
        {empty ? (
          <span className={styles.placeholder}>Tap words to build a message</span>
        ) : (
          tokens.map((t, i) => (
            <span key={i} className={styles.token}>
              {t}
            </span>
          ))
        )}
      </button>
      <div className={styles.controls}>
        <button type="button" className={styles.speak} onClick={onSpeak} disabled={empty}>
          Speak
        </button>
        <button type="button" onClick={onBackspace} disabled={empty} aria-label="Delete last word">
          ⌫
        </button>
        <button type="button" onClick={onClear} disabled={empty}>
          Clear
        </button>
      </div>
    </div>
  );
}
