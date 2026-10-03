"use client";

import { useEffect, useState } from "react";
import type { ConversationTurn, SuggestionRequest, SuggestionResponse } from "./types";

// Wait for a pause in tapping before asking, so a quick run of taps costs one
// request instead of one per tap.
const DEBOUNCE_MS = 300;

interface SuggestionResult {
  key: string; // the request this result answers
  suggestions: string[];
  error: boolean;
}

export interface SuggestionState {
  suggestions: string[];
  loading: boolean; // true while the shown suggestions are for an older message
  error: boolean;
}

export function useSuggestions(
  currentTokens: string[],
  history: ConversationTurn[],
  boardVocabulary: string[],
): SuggestionState {
  const [result, setResult] = useState<SuggestionResult | null>(null);

  const active = currentTokens.length > 0 || history.length > 0;
  const body: SuggestionRequest = { currentTokens, history, boardVocabulary };
  const key = active ? JSON.stringify(body) : "";

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: key,
          signal: controller.signal,
        });
        const data: SuggestionResponse = await res.json();
        setResult({ key, suggestions: res.ok ? data.suggestions : [], error: !res.ok });
      } catch {
        if (!controller.signal.aborted) setResult({ key, suggestions: [], error: true });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  if (!key || !result) return { suggestions: [], loading: Boolean(key), error: false };
  return {
    suggestions: result.suggestions,
    loading: result.key !== key,
    error: result.key === key && result.error,
  };
}
