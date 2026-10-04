import { useEffect, useRef } from "react";
import type { ConversationTurn } from "@/lib/types";
import styles from "./ConversationPanel.module.css";

interface ConversationPanelProps {
  history: ConversationTurn[];
  finished: boolean;
  onRestart: () => void;
}

export default function ConversationPanel({ history, finished, onRestart }: ConversationPanelProps) {
  const logRef = useRef<HTMLOListElement>(null);

  // Keep the newest turn in view as the conversation grows.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [history.length]);

  return (
    <section className={styles.panel} aria-label="Conversation">
      {/* Not a live region: AacApp announces partner lines itself, which also
          works when this panel first appears. */}
      <ol className={styles.log} ref={logRef}>
        {history.map((turn, i) => (
          <li key={i} className={turn.speaker === "user" ? styles.user : styles.other}>
            <span className={styles.speaker}>{turn.speaker === "user" ? "You" : "Partner"}</span>
            {turn.text}
          </li>
        ))}
      </ol>
      {/* Restart only appears once the script is over. Pressing it removes it
          again, so the parent moves focus to the board (see AacApp). */}
      {finished && (
        <div className={styles.end}>
          <span>End of scenario</span>
          <button type="button" onClick={onRestart}>
            Restart
          </button>
        </div>
      )}
    </section>
  );
}
