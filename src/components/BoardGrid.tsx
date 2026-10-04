import { useRef, useState, type KeyboardEvent } from "react";
import type { ObfBoard, ObfButton } from "@/lib/types";
import styles from "./BoardGrid.module.css";

interface BoardGridProps {
  board: ObfBoard;
  onSelect: (button: ObfButton) => void;
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
// arrow keys move between buttons. The grid role also tells screen readers
// such as NVDA to switch to focus mode, so arrows reach this handler instead
// of moving the screen reader's own reading cursor.
export default function BoardGrid({ board, onSelect }: BoardGridProps) {
  const byId = new Map(board.buttons.map((b) => [b.id, b]));
  const buttonEls = useRef(new Map<string, HTMLButtonElement>());

  // The one button that is in the Tab order; reset when a new board loads.
  const [nav, setNav] = useState(() => ({ board, active: edgeButton(board) }));
  let active = nav.active;
  if (nav.board !== board) {
    active = edgeButton(board);
    setNav({ board, active });
  }

  function moveTo(next: Pos | null) {
    if (!next) return;
    setNav({ board, active: next });
    buttonEls.current.get(posKey(next))?.focus();
  }

  function handleKeyDown(e: KeyboardEvent, from: Pos) {
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
      style={{
        gridTemplateColumns: `repeat(${board.grid.columns}, minmax(0, 1fr))`,
        // Rows share whatever height is left on screen (down to a touch-sized
        // minimum), so every button is reachable without scrolling.
        gridTemplateRows: `repeat(${board.grid.rows}, minmax(56px, 1fr))`,
        maxHeight: `${board.grid.rows * 150}px`,
      }}
      role="grid"
      aria-label={board.name}
    >
      {board.grid.order.map((row, r) => (
        <div key={r} role="row" className={styles.row}>
          {row.map((id, c) => {
            const button = id ? byId.get(id) : undefined;
            const pos = { r, c };
            const isActive = active?.r === r && active?.c === c;
            return (
              <div key={c} role="gridcell" className={styles.gridcell}>
                {button && (
                  <button
                    ref={(el) => {
                      if (el) buttonEls.current.set(posKey(pos), el);
                      else buttonEls.current.delete(posKey(pos));
                    }}
                    type="button"
                    className={styles.cell}
                    style={{
                      backgroundColor: button.background_color,
                      borderColor: button.border_color,
                    }}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onSelect(button)}
                    // Clicking or tapping a button makes it the Tab stop too.
                    onFocus={() => !isActive && setNav({ board, active: pos })}
                    onKeyDown={(e) => handleKeyDown(e, pos)}
                  >
                    {button.image_url && (
                      // OBF images are arbitrary remote/data URLs, so next/image's
                      // optimization pipeline doesn't apply.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={button.image_url} alt="" className={styles.image} />
                    )}
                    <span className={styles.label}>{button.label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
