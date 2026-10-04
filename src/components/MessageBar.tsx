import styles from "./MessageBar.module.css";

interface MessageBarProps {
  tokens: string[];
  onSpeak: () => void;
  onBackspace: () => void;
  onClear: () => void;
  /** When set (scenario mode), shows Send – speak and add to the conversation. */
  onSend?: () => void;
}

export default function MessageBar({ tokens, onSpeak, onBackspace, onClear, onSend }: MessageBarProps) {
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
        {onSend && (
          <button type="button" className={styles.primary} onClick={onSend} disabled={empty}>
            Send
          </button>
        )}
        <button
          type="button"
          className={onSend ? undefined : styles.primary}
          onClick={onSpeak}
          disabled={empty}
        >
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
