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
- [ ] Contextual suggestion engine (Next.js route handler → Claude Haiku)
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
src/components/               AacApp (state), BoardGrid, MessageBar
src/app/page.tsx              reads + parses the sample board at build time
```
