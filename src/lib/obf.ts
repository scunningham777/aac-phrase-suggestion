import type { ObfBoard, ObfButton } from "./types";

// Raw shapes as they appear in .obf files (https://www.openboardformat.org/docs).
// Real-world boards are loose: ids may be numbers, labels may be missing, and
// images are referenced by id from a top-level `images` array.
interface RawImage {
  id: string | number;
  url?: string;
  data?: string; // data: URI
}

interface RawButton {
  id: string | number;
  label?: string;
  vocalization?: string;
  image_id?: string | number;
  background_color?: string;
  border_color?: string;
}

interface RawBoard {
  id?: string | number;
  name?: string;
  grid?: {
    rows?: number;
    columns?: number;
    order?: (string | number | null)[][];
  };
  buttons?: RawButton[];
  images?: RawImage[];
}

export class ObfParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObfParseError";
  }
}

export function parseObf(input: unknown): ObfBoard {
  if (typeof input !== "object" || input === null) {
    throw new ObfParseError("Board file is not a JSON object.");
  }
  const raw = input as RawBoard;

  if (!Array.isArray(raw.buttons)) {
    throw new ObfParseError("Board has no `buttons` array.");
  }
  const { rows, columns, order } = raw.grid ?? {};
  if (!rows || !columns || !Array.isArray(order)) {
    throw new ObfParseError("Board has no valid `grid` (rows, columns, order).");
  }

  const imageUrls = new Map<string, string>();
  for (const img of raw.images ?? []) {
    const src = img.url ?? img.data;
    if (src) imageUrls.set(String(img.id), src);
  }

  const buttons: ObfButton[] = raw.buttons.map((b) => {
    const label = b.label ?? b.vocalization ?? "";
    return {
      id: String(b.id),
      label,
      vocalization: b.vocalization,
      image_url: b.image_id != null ? imageUrls.get(String(b.image_id)) : undefined,
      background_color: b.background_color,
      border_color: b.border_color,
    };
  });

  const buttonIds = new Set(buttons.map((b) => b.id));
  // Normalize to exactly rows x columns; drop references to missing buttons.
  const normalizedOrder = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: columns }, (_, c) => {
      const cell = order[r]?.[c];
      if (cell == null) return null;
      const id = String(cell);
      return buttonIds.has(id) ? id : null;
    }),
  );

  return {
    id: String(raw.id ?? "board"),
    name: raw.name ?? "Untitled board",
    grid: { rows, columns, order: normalizedOrder },
    buttons,
  };
}

/** The text a button contributes to the message (and to TTS). */
export function buttonText(button: ObfButton): string {
  return button.vocalization ?? button.label;
}

/** Unique words/phrases reachable on the board – grounding context for suggestions. */
export function boardVocabulary(board: ObfBoard): string[] {
  const byId = new Map(board.buttons.map((b) => [b.id, b]));
  const vocab = new Set<string>();
  for (const id of board.grid.order.flat()) {
    const button = id ? byId.get(id) : undefined;
    if (button) vocab.add(buttonText(button));
  }
  return [...vocab];
}
