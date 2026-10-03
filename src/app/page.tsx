import { readFile } from "node:fs/promises";
import path from "node:path";
import AacApp from "@/components/AacApp";
import { parseObf } from "@/lib/obf";

// The page is statically rendered, so the sample board is read and parsed at
// build time and shipped to the client already normalized.
const SAMPLE_BOARD = path.join(process.cwd(), "public", "boards", "core-chat.obf");

export default async function Home() {
  const board = parseObf(JSON.parse(await readFile(SAMPLE_BOARD, "utf8")));
  return <AacApp initialBoard={board} />;
}
