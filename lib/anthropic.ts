import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("MISSING_API_KEY");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Llama a Claude con un system prompt + user prompt y devuelve el
 * texto crudo de la respuesta (se espera que sea JSON puro).
 */
export async function callClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const anthropic = getClient();
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("EMPTY_AI_RESPONSE");
  }
  return textBlock.text;
}

/** Limpia posibles fences de markdown antes de parsear JSON. */
export function parseJSONSafe<T>(raw: string): T {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}
