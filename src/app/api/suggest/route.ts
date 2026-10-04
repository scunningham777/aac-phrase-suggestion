import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { isSameOrigin, withinRateLimit } from "@/lib/guard";
import { buildSuggestionPrompt, SUGGESTION_SYSTEM_PROMPT } from "@/lib/suggestionPrompt";
import type { SuggestionRequest, SuggestionResponse } from "@/lib/types";

const MODEL = "claude-haiku-4-5";
const MAX_SUGGESTIONS = 5;

// This endpoint is public once deployed, so cap input sizes – they bound
// what any single request can cost.
const RequestSchema: z.ZodType<SuggestionRequest> = z.object({
  currentTokens: z.array(z.string().max(100)).max(50),
  history: z
    .array(z.object({ speaker: z.enum(["user", "other"]), text: z.string().max(500) }))
    .max(20),
  boardVocabulary: z.array(z.string().max(100)).max(500),
});

const OutputSchema = z.object({ suggestions: z.array(z.string()) });

// Created on first request rather than at import, so a missing key fails the
// request instead of the build. Suggestions go stale after a tap or two, so a
// slow call is worthless: short timeout, one retry.
let client: Anthropic | undefined;
function getClient() {
  client ??= new Anthropic({ timeout: 10_000, maxRetries: 1 });
  return client;
}

function errorResponse(status: number, error: string) {
  return Response.json({ suggestions: [], error }, { status });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse(403, "Forbidden.");
  if (!(await withinRateLimit(request))) {
    return errorResponse(429, "Too many requests – try again shortly.");
  }

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse(400, "Invalid suggestion request.");
  const req = parsed.data;

  try {
    const response = await getClient().messages.parse(
      {
        model: MODEL,
        max_tokens: 256,
        system: SUGGESTION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildSuggestionPrompt(req) }],
        output_config: { format: zodOutputFormat(OutputSchema) },
      },
      // Abort the upstream call when the browser cancels (the user tapped again).
      { signal: request.signal },
    );

    const already = new Set(req.currentTokens.map((t) => t.toLowerCase()));
    const seen = new Set<string>();
    const suggestions = (response.parsed_output?.suggestions ?? [])
      .map((s) => s.trim())
      .filter((s) => {
        const key = s.toLowerCase();
        if (!s || seen.has(key) || already.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_SUGGESTIONS);

    return Response.json({ suggestions } satisfies SuggestionResponse);
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError) return errorResponse(499, "Request cancelled.");
    if (err instanceof Anthropic.RateLimitError) return errorResponse(429, "Rate limited – try again shortly.");
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic auth failed – check ANTHROPIC_API_KEY.");
      return errorResponse(500, "Suggestions are not configured.");
    }
    console.error("Suggestion request failed:", err);
    return errorResponse(502, "Suggestions are unavailable right now.");
  }
}
