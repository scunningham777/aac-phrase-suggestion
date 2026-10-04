"use client";

import { useEffect, useRef, useState } from "react";

// Screen readers judge a live region by its text: writing the same sentence
// into it twice (the same scenario opener after Free talk, or after Restart)
// is not a change, so nothing is read. Each announcement therefore empties
// the region first and writes the text a moment later, so the screen reader
// always sees "empty -> new text" – the approach libraries like React Aria use.
const WRITE_DELAY_MS = 150;

export function useAnnouncer() {
  const [text, setText] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function announce(next: string) {
    clearTimeout(timer.current);
    setText("");
    if (next) timer.current = setTimeout(() => setText(next), WRITE_DELAY_MS);
  }

  return { text, announce };
}
