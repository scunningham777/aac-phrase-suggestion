import { useEffect, useRef, type ReactNode } from "react";
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

// On phones the controls shrink to icons (see MessageBar.module.css); the text
// stays in the DOM, visually hidden, as each button's accessible name.
function Label({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.text}>{text}</span>
    </>
  );
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const SEND_ICON = (
  <svg {...iconProps}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

const SPEAK_ICON = (
  <svg {...iconProps}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);

const CLEAR_ICON = (
  <svg {...iconProps}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

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
  const tokensRef = useRef<HTMLSpanElement>(null);

  // On phones the message is a single line; keep the newest words in view.
  // (On wider screens tokens wrap, so there's nothing to scroll.)
  useEffect(() => {
    const el = tokensRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [tokens]);

  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.message}
        onClick={hasText ? onSpeak : undefined}
        aria-label={hasText ? `Speak message: ${tokens.join(" ")}` : "Message is empty"}
      >
        {hasText ? (
          <span ref={tokensRef} className={styles.tokens}>
            {tokens.map((t, i) => (
              <span key={i} className={styles.token}>
                {t}
              </span>
            ))}
          </span>
        ) : (
          <span className={styles.placeholder}>Tap words to build a message</span>
        )}
      </button>
      <div className={styles.controls}>
        {onSend && (
          <button type="button" className={styles.primary} {...control(hasText && !sendDisabled, onSend)}>
            <Label icon={SEND_ICON} text="Send" />
          </button>
        )}
        <button
          type="button"
          className={onSend ? undefined : styles.primary}
          {...control(hasText, onSpeak)}
        >
          <Label icon={SPEAK_ICON} text="Speak" />
        </button>
        <button type="button" aria-label="Delete last word" {...control(hasText, onBackspace)}>
          ⌫
        </button>
        <button type="button" {...control(hasText, onClear)}>
          <Label icon={CLEAR_ICON} text="Clear" />
        </button>
      </div>
    </div>
  );
}
