"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import BoardGrid from "./BoardGrid";
import MessageBar from "./MessageBar";
import SuggestionBar from "./SuggestionBar";
import { boardVocabulary, buttonText, ObfParseError, parseObf } from "@/lib/obf";
import { speak } from "@/lib/speech";
import { useSuggestions } from "@/lib/useSuggestions";
import type { ConversationTurn, ObfBoard, ObfButton } from "@/lib/types";
import styles from "./AacApp.module.css";

// Conversation history arrives with demo scenario mode; until then, none.
const NO_HISTORY: ConversationTurn[] = [];

interface AacAppProps {
  initialBoard: ObfBoard;
}

export default function AacApp({ initialBoard }: AacAppProps) {
  const [board, setBoard] = useState(initialBoard);
  const [tokens, setTokens] = useState<string[]>([]);
  const [speakOnTap, setSpeakOnTap] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const vocabulary = useMemo(() => boardVocabulary(board), [board]);
  const suggestions = useSuggestions(tokens, NO_HISTORY, vocabulary);

  function addToMessage(text: string) {
    setTokens((prev) => [...prev, text]);
    if (speakOnTap) speak(text);
  }

  function handleSelect(button: ObfButton) {
    addToMessage(buttonText(button));
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

      <SuggestionBar {...suggestions} onSelect={addToMessage} />

      <BoardGrid board={board} onSelect={handleSelect} />
    </main>
  );
}
