import type { SuggestionRequest } from "./types";

// How many prior conversation turns to include as context.
export const HISTORY_TURNS = 6;

export const SUGGESTION_SYSTEM_PROMPT = `You suggest next words for a person using an AAC (augmentative and alternative communication) board. They can't speak aloud, so they build messages by tapping words one at a time, which is slow. Your suggestions let them skip taps.

Each suggestion is appended to the end of their message exactly as written, so it must continue the message naturally from where it stops. Never repeat words already in the message and never rewrite it.

Give 3 to 5 suggestions, most likely first. Each is 1 to 4 words in the user's own first-person voice, written as plain words: no punctuation except apostrophes, lowercase except "I" and proper nouns. Mix lengths: include at least one single next word and at least one short phrase that would complete the thought.

Prefer words from the board vocabulary so suggestions stay consistent with the board, but use other common words when the board doesn't have what the sentence needs. If the message is empty, suggest natural ways to start, replying to the other person's last turn when there is one.`;

export function buildSuggestionPrompt(req: SuggestionRequest): string {
  const history = req.history.slice(-HISTORY_TURNS);
  const conversation = history.length
    ? history.map((t) => `${t.speaker === "user" ? "AAC user" : "Other person"}: ${t.text}`).join("\n")
    : "(no prior conversation)";
  const message = req.currentTokens.join(" ") || "(empty)";

  return `<board_vocabulary>
${req.boardVocabulary.join(", ")}
</board_vocabulary>

<conversation>
${conversation}
</conversation>

<message_so_far>
${message}
</message_so_far>

Suggest what comes next.`;
}
