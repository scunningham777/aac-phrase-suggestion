import type { ObfBoard, ObfButton } from "@/lib/types";
import styles from "./BoardGrid.module.css";

interface BoardGridProps {
  board: ObfBoard;
  onSelect: (button: ObfButton) => void;
}

export default function BoardGrid({ board, onSelect }: BoardGridProps) {
  const byId = new Map(board.buttons.map((b) => [b.id, b]));

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
      role="group"
      aria-label={board.name}
    >
      {board.grid.order.flatMap((row, r) =>
        row.map((id, c) => {
          const button = id ? byId.get(id) : undefined;
          if (!button) return <div key={`${r}-${c}`} className={styles.empty} />;
          return (
            <button
              key={`${r}-${c}`}
              type="button"
              className={styles.cell}
              style={{
                backgroundColor: button.background_color,
                borderColor: button.border_color,
              }}
              onClick={() => onSelect(button)}
            >
              {button.image_url && (
                // OBF images are arbitrary remote/data URLs, so next/image's
                // optimization pipeline doesn't apply.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={button.image_url} alt="" className={styles.image} />
              )}
              <span className={styles.label}>{button.label}</span>
            </button>
          );
        }),
      )}
    </div>
  );
}
