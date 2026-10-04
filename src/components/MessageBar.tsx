import styles from "./MessageBar.module.css";

interface MessageBarProps {
  tokens: string[];
  onSpeak: () => void;
  onBackspace: () => void;
  onClear: () => void;
  /** When set (scenario mode), shows Send – speak and add to the conversation. */
  onSend?: () => void;
  /** Keeps Send in place but unavailable, e.g. once the scenario has ended. */
  sendDisabled?: boolean;
}

// aria-disabled instead of disabled: a disabled button drops keyboard focus to
// the top of the page, which happens constantly here (Clear empties the
// message, which would disable Clear itself).
function control(enabled: boolean, onClick: () => void) {
  return { "aria-disabled": !enabled, onClick: enabled ? onClick : undefined };
}

export default function MessageBar({
  tokens,
  onSpeak,
  onBackspace,
  onClear,
  onSend,
  sendDisabled = false,
}: MessageBarProps) {
  const hasText = tokens.length > 0;

  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.message}
        onClick={hasText ? onSpeak : undefined}
        aria-label={hasText ? `Speak message: ${tokens.join(" ")}` : "Message is empty"}
      >
        {hasText ? (
          tokens.map((t, i) => (
            <span key={i} className={styles.token}>
              {t}
            </span>
          ))
        ) : (
          <span className={styles.placeholder}>Tap words to build a message</span>
        )}
      </button>
      <div className={styles.controls}>
        {onSend && (
          <button type="button" className={styles.primary} {...control(hasText && !sendDisabled, onSend)}>
            Send
          </button>
        )}
        <button
          type="button"
          className={onSend ? undefined : styles.primary}
          {...control(hasText, onSpeak)}
        >
          Speak
        </button>
        <button type="button" aria-label="Delete last word" {...control(hasText, onBackspace)}>
          ⌫
        </button>
        <button type="button" {...control(hasText, onClear)}>
          Clear
        </button>
      </div>
    </div>
  );
}
