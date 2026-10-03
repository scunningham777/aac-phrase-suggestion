# AAC Contextual Phrase Suggestion — Project Spec

## Problem

AAC (Augmentative and Alternative Communication) boards let non-speaking users build sentences by tapping symbols/words. Existing boards are mostly static grids — no contextual help surfacing *likely next phrases* based on conversation history or situation. Academic research on LLM-assisted AAC prediction exists, but there's no open source implementation that takes it from paper to usable tool. This project closes that gap: a working prototype, built on the open **Open Board Format (OBF)** standard, that uses an LLM to suggest contextual phrases as the user communicates.

Goal of the prototype: demonstrate the concept works and is usable, not ship a production AAC app.

## MVP Scope

In scope:
- Load and render a board from an OBF file (grid of symbols/buttons)
- User builds a message by tapping symbols (standard AAC interaction)
- As the user builds a message (or after each tap), call an LLM to suggest 3-5 likely next phrases/words based on: current message so far, recent conversation history, and the active board's vocabulary
- Suggested phrases are tappable shortcuts — selecting one appends it to the message
- Basic text-to-speech playback of the built message (browser-native `SpeechSynthesis` API — no extra service needed)
- One sample OBF board included for demoing

Explicitly out of scope for MVP:
- Board editing/authoring UI
- User accounts, saved history across sessions, multi-user support
- Mobile/tablet-native app (web only, but should be usable on a tablet browser)
- Eye-tracking or switch-access input methods
- Any suggestion caching/offline mode
- Clinical validation or accessibility certification

## Core Features

1. **OBF Board Loader**
   - Parse an `.obf` JSON file into a renderable grid
   - Support basic OBF fields: buttons (label, image, vocalization text), grid layout, board linking (optional — single board is fine for MVP)

2. **Message Builder**
   - Tap sequence builds a running message string
   - Clear/backspace controls
   - Speak button (TTS) for the assembled message

3. **Contextual Suggestion Engine**
   - On each change to the in-progress message, send context to the backend:
     - current message tokens
     - last N exchanges of conversation (if simulating a back-and-forth demo scenario)
     - available vocabulary on the current board (so suggestions stay groundable to real buttons where possible)
   - Backend calls Claude Haiku with a prompt engineered to return 3-5 short, high-likelihood next phrases
   - Return suggestions to frontend, rendered as tappable chips above/below the board

4. **Demo Scenario Mode**
   - Since there's no real user population to test with, include a scripted demo scenario (e.g. "ordering at a restaurant," "catching up with a friend") so suggestion quality is visibly demonstrable without live multi-turn use

## Tech Stack

- **Frontend:** React + TypeScript
- **Backend:** Next.js API routes (keeps frontend/backend in one deployable project)
- **Hosting:** Vercel
- **LLM:** Anthropic API, Claude Haiku (via `@anthropic-ai/sdk`)
- **TTS:** Browser-native `SpeechSynthesis` Web API (no backend service needed)
- **Board format:** Open Board Format (OBF) — parse directly from JSON, no conversion layer needed for MVP

**Dev setup note:** if `ANTHROPIC_API_KEY` is set system-wide, Claude Code will use API billing instead of Pro subscription usage — scope the key to the project `.env` only, not a global/system environment variable.

## Data Model

Kept intentionally thin for MVP — no database, no persistence. All state lives in memory/React state for the duration of a session.

```ts
// OBF board (minimal subset of the real OBF spec needed for MVP)
interface ObfButton {
  id: string;
  label: string;
  vocalization?: string; // text to speak/insert if different from label
  image_url?: string;
  background_color?: string;
}

interface ObfBoard {
  id: string;
  name: string;
  grid: {
    rows: number;
    columns: number;
    order: (string | null)[][]; // button ids placed in grid, null = empty cell
  };
  buttons: ObfButton[];
}

// In-progress message state
interface MessageState {
  tokens: string[];        // words/phrases tapped so far, in order
  history: ConversationTurn[]; // prior turns, for context (demo scenario mode)
}

interface ConversationTurn {
  speaker: "user" | "other";
  text: string;
}

// Suggestion request sent to backend
interface SuggestionRequest {
  currentTokens: string[];
  history: ConversationTurn[];
  boardVocabulary: string[]; // labels/vocalizations available on current board
}

// Suggestion response from backend
interface SuggestionResponse {
  suggestions: string[]; // 3-5 short phrases
}
```

## Open Questions / Assumptions to Flag for Claude Code

- No specific OBF sample board file has been chosen yet — will need one sourced or hand-built for the demo
- Suggestion prompt engineering (what context window size, how strictly to ground suggestions in board vocabulary vs. free-form) will need iteration once something is running
- No design/visual direction specified yet — functional UI is the priority for MVP, not polish
