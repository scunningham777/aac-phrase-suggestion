"use client";

import { useState, type ChangeEvent } from "react";
import BoardGrid from "./BoardGrid";
import MessageBar from "./MessageBar";
import { buttonText, ObfParseError, parseObf } from "@/lib/obf";
import { speak } from "@/lib/speech";
import type { ObfBoard, ObfButton } from "@/lib/types";
import styles from "./AacApp.module.css";

interface AacAppProps {
  initialBoard: ObfBoard;
}

export default function AacApp({ initialBoard }: AacAppProps) {
  const [board, setBoard] = useState(initialBoard);
  const [tokens, setTokens] = useState<string[]>([]);
  const [speakOnTap, setSpeakOnTap] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  function handleSelect(button: ObfButton) {
    const text = buttonText(button);
    setTokens((prev) => [...prev, text]);
    if (speakOnTap) speak(text);
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    try {
      setBoard(parseObf(JSON.parse(await file.text())));
      setTokens([]);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof ObfParseError || err instanceof SyntaxError
          ? `Couldn't load ${file.name}: ${err.message}`
          : `Couldn't load ${file.name}.`,
      );
    }
  }

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>{board.name}</h1>
        <div className={styles.options}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={speakOnTap}
              onChange={(e) => setSpeakOnTap(e.target.checked)}
            />
            Speak each tap
          </label>
          <label className={styles.fileButton}>
            Load .obf board
            <input type="file" accept=".obf,application/json" onChange={handleFile} hidden />
          </label>
        </div>
      </header>
      {loadError && (
        <p className={styles.error} role="alert">
          {loadError}
        </p>
      )}

      <MessageBar
        tokens={tokens}
        onSpeak={() => speak(tokens.join(" "))}
        onBackspace={() => setTokens((prev) => prev.slice(0, -1))}
        onClear={() => setTokens([])}
      />

      {/* Suggestion chips (week 4) render here, between the message and the board. */}

      <BoardGrid board={board} onSelect={handleSelect} />
    </main>
  );
}
