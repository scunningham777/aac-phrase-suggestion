import { useImperativeHandle, useRef, useState, type KeyboardEvent, type Ref } from "react";
import type { ObfBoard, ObfButton } from "@/lib/types";
import styles from "./BoardGrid.module.css";

export interface BoardGridHandle {
  /** Focus the board's current cell (its single Tab stop). */
  focus: () => void;
}

interface BoardGridProps {
  board: ObfBoard;
  onSelect: (button: ObfButton) => void;
  ref?: Ref<BoardGridHandle>;
}

type Pos = { r: number; c: number };

const posKey = ({ r, c }: Pos) => `${r}-${c}`;

function hasButton(board: ObfBoard, r: number, c: number): boolean {
  return board.grid.order[r]?.[c] != null;
}

/** First cell holding a button, scanning row by row (or backwards). */
function edgeButton(board: ObfBoard, fromEnd = false): Pos | null {
  const cells = board.grid.order.flatMap((row, r) => row.map((_, c) => ({ r, c })));
  if (fromEnd) cells.reverse();
  return cells.find(({ r, c }) => hasButton(board, r, c)) ?? null;
}

/** Next button from `from` in direction (dr, dc), skipping empty cells; null at the edge. */
function step(board: ObfBoard, from: Pos, dr: number, dc: number): Pos | null {
  let { r, c } = from;
  for (;;) {
    r += dr;
    c += dc;
    if (r < 0 || c < 0 || r >= board.grid.rows || c >= board.grid.columns) return null;
    if (hasButton(board, r, c)) return { r, c };
  }
}

function rowEdge(board: ObfBoard, r: number, fromEnd: boolean): Pos | null {
  const cols = board.grid.order[r].map((_, c) => c);
  if (fromEnd) cols.reverse();
  const c = cols.find((c) => hasButton(board, r, c));
  return c === undefined ? null : { r, c };
}

// An ARIA grid with a roving tabindex: the board is a single Tab stop and the
// arrow keys move between cells.
//
// The gridcell itself is the focusable, activatable element – not a <button>
// inside it. NVDA switches to focus mode (so arrow keys reach this handler
// instead of moving its own reading cursor) when a focusable table cell gets
// focus, but a focused button keeps it in browse mode, even inside a grid.
// See shouldPassThrough in NVDA's source/browseMode.py.
export default function BoardGrid({ board, onSelect, ref }: BoardGridProps) {
  const byId = new Map(board.buttons.map((b) => [b.id, b]));
  const cellEls = useRef(new Map<string, HTMLDivElement>());

  // The one button that is in the Tab order; reset when a new board loads.
  const [nav, setNav] = useState(() => ({ board, active: edgeButton(board) }));
  let active = nav.active;
  if (nav.board !== board) {
    active = edgeButton(board);
    setNav({ board, active });
  }

  useImperativeHandle(
    ref,
    () => ({ focus: () => active && cellEls.current.get(posKey(active))?.focus() }),
    [active],
  );

  function moveTo(next: Pos | null) {
    if (!next) return;
    setNav({ board, active: next });
    cellEls.current.get(posKey(next))?.focus();
  }

  function handleKeyDown(e: KeyboardEvent, from: Pos, button: ObfButton) {
    // Cells aren't native buttons, so activate on Enter/Space ourselves.
    // Ignore auto-repeat so a held key can't add the word over and over.
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!e.repeat) onSelect(button);
      return;
    }
    const keys: Record<string, () => Pos | null> = {
      ArrowRight: () => step(board, from, 0, 1),
      ArrowLeft: () => step(board, from, 0, -1),
      ArrowDown: () => step(board, from, 1, 0),
      ArrowUp: () => step(board, from, -1, 0),
      Home: () => (e.ctrlKey ? edgeButton(board) : rowEdge(board, from.r, false)),
      End: () => (e.ctrlKey ? edgeButton(board, true) : rowEdge(board, from.r, true)),
    };
    const target = keys[e.key];
    if (!target) return;
    e.preventDefault();
    moveTo(target());
  }

  return (
    <div
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${board.grid.columns}, minmax(0, 1fr))` }}
      role="grid"
      aria-label={board.name}
    >
      {board.grid.order.map((row, r) => (
        <div key={r} role="row" className={styles.row}>
          {row.map((id, c) => {
            const button = id ? byId.get(id) : undefined;
            const pos = { r, c };
            const isActive = active?.r === r && active?.c === c;
            if (!button) return <div key={c} role="gridcell" className={styles.empty} />;
            return (
              <div
                key={c}
                role="gridcell"
                aria-label={button.label}
                ref={(el) => {
                  if (el) cellEls.current.set(posKey(pos), el);
                  else cellEls.current.delete(posKey(pos));
                }}
                className={styles.cell}
                style={{
                  backgroundColor: button.background_color,
                  borderColor: button.border_color,
                }}
                tabIndex={isActive ? 0 : -1}
                // Also fires when NVDA activates the cell from browse mode.
                onClick={() => onSelect(button)}
                // Clicking or tapping a cell makes it the Tab stop too.
                onFocus={() => !isActive && setNav({ board, active: pos })}
                onKeyDown={(e) => handleKeyDown(e, pos, button)}
              >
                {button.image_url && (
                  // OBF images are arbitrary remote/data URLs, so next/image's
                  // optimization pipeline doesn't apply.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={button.image_url} alt="" className={styles.image} />
                )}
                <span className={styles.label}>{button.label}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
