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
- [x] Demo scenario mode (scripted conversation context)
- [x] Accessibility pass (WCAG 2.2 AA via axe-core, plus keyboard focus and screen-reader fixes)
- [ ] Vercel deploy (with rate limiting + origin check on `/api/suggest`)

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
public/boards/core-chat.obf   sample 30-word core vocabulary board
src/lib/obf.ts                raw .obf JSON → normalized ObfBoard
src/lib/speech.ts             Web Speech API wrapper
src/lib/types.ts              data model from the spec
src/lib/suggestionPrompt.ts   system prompt + context formatting for suggestions
src/lib/useSuggestions.ts     debounced, cancellable client for /api/suggest
src/lib/scenarios.ts          scripted conversation partners for demo mode
src/lib/guard.ts              same-origin check + rate limit for /api/suggest
src/components/               AacApp (state), BoardGrid, MessageBar,
                              SuggestionBar, ConversationPanel
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
credit, so it is guarded in layers (`src/lib/guard.ts`):

- **Same-origin check** – requests must carry this site's own `Origin`, which
  stops other websites from using the endpoint.
- **Per-IP rate limit** – 30/minute and 500/day, via Upstash Redis. Active
  only when an Upstash store is connected (see `.env.example`).
- **Spend limit** – the API key belongs to a Console workspace with a monthly
  cap, which bounds the worst case regardless.

## Demo scenarios

Pick a scenario (restaurant, catching up with a friend, doctor's visit) from
the header to talk with a scripted partner. Their first line appears and
suggestions immediately offer replies to it. **Send** speaks your message,
adds it to the transcript, and brings up the partner's next line, so the last
few turns of real conversation feed every suggestion request. Scripts live in
`src/lib/scenarios.ts` – each is just the partner's lines, written to make
sense whatever the user replies.
