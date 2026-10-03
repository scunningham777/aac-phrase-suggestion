# AAC Phrase Suggestion

A web-based AAC (Augmentative and Alternative Communication) board built on the
[Open Board Format](https://www.openboardformat.org/) that uses Claude to suggest
likely next phrases as the user builds a message. Prototype – the goal is to
show the concept works and is usable, not to ship a production AAC app.

Full spec: [docs/SPEC.md](docs/SPEC.md)

## Status

- [x] OBF board loader (sample board + load any `.obf` file)
- [x] Message builder – tap to add, backspace, clear
- [x] Text-to-speech via the browser's `SpeechSynthesis` API
- [x] Contextual suggestion engine (Next.js route handler → Claude Haiku)
- [ ] Demo scenario mode (scripted conversation context)
- [ ] Accessibility pass + Vercel deploy

## Getting started

Requires Node 20.9+ (`.nvmrc` pins 24).

```sh
nvm use 24
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY (needed for suggestions)
npm run dev
```

Open http://localhost:3000.

## Project layout

```
public/boards/core-chat.obf   sample 24-word core vocabulary board
src/lib/obf.ts                raw .obf JSON → normalized ObfBoard
src/lib/speech.ts             Web Speech API wrapper
src/lib/types.ts              data model from the spec
src/lib/suggestionPrompt.ts   system prompt + context formatting for suggestions
src/lib/useSuggestions.ts     debounced, cancellable client for /api/suggest
src/components/               AacApp (state), BoardGrid, MessageBar, SuggestionBar
src/app/page.tsx              reads + parses the sample board at build time
src/app/api/suggest/route.ts  POST → Claude Haiku (structured output) → 3–5 phrases
```

## How suggestions work

After each change to the message (debounced 300 ms), the browser POSTs the
current tokens, recent conversation turns, and the board's vocabulary to
`/api/suggest`. The route handler validates and size-caps the input, calls
`claude-haiku-4-5` with a JSON schema so the reply is always
`{ suggestions: string[] }`, then trims and dedupes. If the user taps again
mid-request, the browser aborts and the abort is forwarded to the Anthropic
call. The API key only ever exists on the server.

Once deployed, `/api/suggest` is publicly reachable and spends your API
credit – keep a monthly spend limit set in the Anthropic Console.
