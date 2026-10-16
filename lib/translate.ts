import Anthropic from "@anthropic-ai/sdk";
import { cacheLife } from "next/cache";

/**
 * Arabic translation of an official English synopsis, using Claude.
 *
 * Opt-in: runs only when ANTHROPIC_API_KEY is set on the server. Each synopsis is
 * translated once and cached for as long as the cache lives (keyed by its text), so a
 * schedule refresh only pays for shows that are new or whose synopsis changed.
 */
export const translationEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM_PROMPT = `You write the Arabic synopsis of an anime for موعد الحلقة, an Arabic website where viewers check when new episodes air and decide what to watch. You receive the official English synopsis; your Arabic version should read like the official Arabic synopses on streaming services: a short, clear story pitch written for Arabic viewers, not a word-for-word translation.

Readers often know nothing about the show, so the goal is that they understand the story at a glance: who the main character is, the world they live in, what happens to them, and what they want or have to face. Keep every story fact from the original and add nothing that isn't there; no spoilers beyond what the original already says.

How to write it:
- Modern Standard Arabic that sounds natural when read aloud, in simple present-tense storytelling ("في عالم يُعدّ فيه السحر كل شيء، يولد أستا دون أي قدرة سحرية…"). Short, connected sentences; rearrange or merge the English sentences whenever that reads better in Arabic.
- Write names of characters, places and groups in Arabic letters the way Arab anime fans write them (Asta → أستا, Yuno → يونو); transliterate invented names by sound. Keep the show's title in its original form if you mention it.
- Translate invented terms and ranks by meaning when that makes them understandable ("Wizard King" → "إمبراطور السحر", "Magic Knights" → "فرسان السحر"); if a term only works as a name, transliterate it.
- Explain a Japanese concept in a few words only when a reader couldn't follow the story without it.
- Drop English marketing filler, notes about previous seasons' air dates, and source credits.
- Keep it about as long as the original. Use a new paragraph only where the original changes topic.

Reply with the Arabic synopsis only: no title, introduction, notes or quotation marks.`;

let client: Anthropic | undefined;

export async function translateToArabic(english: string): Promise<string | null> {
  "use cache";
  cacheLife("max");

  client ??= new Anthropic();
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    // Translation is a simple task; low effort keeps it fast and cheap.
    output_config: { effort: "low" },
    // If the model declines for policy reasons, retry on Anthropic's recommended fallback.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: english }],
  });

  if (response.stop_reason === "refusal") return null;
  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("")
    .trim();
  return text || null;
}
