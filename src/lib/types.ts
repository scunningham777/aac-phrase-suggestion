// Data model from docs/SPEC.md. The OBF types are the minimal, normalized
// subset of the Open Board Format the app renders – see lib/obf.ts for the
// mapping from raw .obf JSON.

export interface ObfButton {
  id: string;
  label: string;
  vocalization?: string; // text to speak/insert if different from label
  image_url?: string;
  background_color?: string;
  border_color?: string;
}

export interface ObfBoard {
  id: string;
  name: string;
  grid: {
    rows: number;
    columns: number;
    order: (string | null)[][]; // button ids placed in grid, null = empty cell
  };
  buttons: ObfButton[];
}

export interface ConversationTurn {
  speaker: "user" | "other";
  text: string;
}

export interface MessageState {
  tokens: string[]; // words/phrases tapped so far, in order
  history: ConversationTurn[]; // prior turns, for context (demo scenario mode)
}

export interface SuggestionRequest {
  currentTokens: string[];
  history: ConversationTurn[];
  boardVocabulary: string[]; // labels/vocalizations available on current board
}

export interface SuggestionResponse {
  suggestions: string[]; // 3-5 short phrases
}
