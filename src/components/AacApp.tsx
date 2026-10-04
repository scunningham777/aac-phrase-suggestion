"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import BoardGrid from "./BoardGrid";
import ConversationPanel from "./ConversationPanel";
import MessageBar from "./MessageBar";
import SuggestionBar from "./SuggestionBar";
import { boardVocabulary, buttonText, ObfParseError, parseObf } from "@/lib/obf";
import { SCENARIOS, type Scenario } from "@/lib/scenarios";
import { speak } from "@/lib/speech";
import { useSuggestions } from "@/lib/useSuggestions";
import type { ConversationTurn, ObfBoard, ObfButton } from "@/lib/types";
import styles from "./AacApp.module.css";

const NO_HISTORY: ConversationTurn[] = [];

interface AacAppProps {
  initialBoard: ObfBoard;
}

export default function AacApp({ initialBoard }: AacAppProps) {
  const [board, setBoard] = useState(initialBoard);
  const [tokens, setTokens] = useState<string[]>([]);
  const [speakOnTap, setSpeakOnTap] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [history, setHistory] = useState<ConversationTurn[]>([]);

  // The script is over once every partner line is out and the user has replied.
  const partnerTurns = history.filter((t) => t.speaker === "other").length;
  const finished =
    scenario !== null &&
    partnerTurns >= scenario.partnerLines.length &&
    history.at(-1)?.speaker === "user";

  const vocabulary = useMemo(() => boardVocabulary(board), [board]);
  // No one is left to reply to after the script ends, so stop sending its history.
  const suggestions = useSuggestions(tokens, finished ? NO_HISTORY : history, vocabulary);

  function startScenario(next: Scenario | null) {
    setScenario(next);
    setTokens([]);
    setHistory(next ? [{ speaker: "other", text: next.partnerLines[0] }] : []);
  }

  function send() {
    const text = tokens.join(" ");
    if (!scenario || !text) return;
    speak(text);
    const reply = scenario.partnerLines[partnerTurns];
    const turns: ConversationTurn[] = [{ speaker: "user", text }];
    if (reply) turns.push({ speaker: "other", text: reply });
    setHistory((prev) => [...prev, ...turns]);
    setTokens([]);
  }

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
            Scenario
            <select
              className={styles.select}
              value={scenario?.id ?? ""}
              onChange={(e) => startScenario(SCENARIOS.find((s) => s.id === e.target.value) ?? null)}
            >
              <option value="">Free talk</option>
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
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

      {scenario && (
        <ConversationPanel
          history={history}
          finished={finished}
          onRestart={() => startScenario(scenario)}
        />
      )}

      <MessageBar
        tokens={tokens}
        onSpeak={() => speak(tokens.join(" "))}
        onBackspace={() => setTokens((prev) => prev.slice(0, -1))}
        onClear={() => setTokens([])}
        onSend={scenario && !finished ? send : undefined}
      />

      <SuggestionBar {...suggestions} onSelect={addToMessage} />

      <BoardGrid board={board} onSelect={handleSelect} />
    </main>
  );
}
