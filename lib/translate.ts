import Anthropic from "@anthropic-ai/sdk";
import { cacheLife } from "next/cache";

/**
 * Arabic translation of official English synopses and automatic Arabic show names, using Claude.
 *
 * Opt-in: runs only when ANTHROPIC_API_KEY is set on the server. Each synopsis or title is
 * translated once and cached for as long as the cache lives (keyed by its text), so a
 * schedule refresh only pays for shows that are new or whose text changed.
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

const TITLE_PROMPT = `You give the Arabic name of an anime for موعد الحلقة, an Arabic website where viewers check when new episodes air. You receive the show's English title and its romaji (Japanese) title.

- If Arab fans already know the show by an Arabic name (an Arabic dub title or a widely used fan name), use exactly that name ("Detective Conan" → "المحقق كونان").
- Otherwise write the title in Arabic letters the way Arab anime fans would write it: transliterate names and invented words by sound ("Black Clover" → "بلاك كلوفر"), and translate a plain descriptive title or subtitle by meaning when that reads naturally ("The Apothecary Diaries" → "مذكرات الصيدلانية").
- Base it on whichever title fans actually use, usually the English one; use the romaji one when the show has no real English title.
- Write season and part numbers as Western digits after the name ("Season 2" → "2"), and keep a subtitle after a colon.
- Don't invent anything that isn't in the titles.

Reply with the Arabic name only: one line, no explanation or quotation marks.`;

let client: Anthropic | undefined;

/** One short reply from Claude, or null if it declined. */
async function ask(system: string, content: string, maxTokens: number): Promise<string | null> {
  client ??= new Anthropic();
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: maxTokens,
    // Translation is a simple task; low effort keeps it fast and cheap.
    output_config: { effort: "low" },
    // If the model declines for policy reasons, retry on Anthropic's recommended fallback.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") return null;
  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("")
    .trim();
  return text || null;
}

export async function translateToArabic(english: string): Promise<string | null> {
  "use cache";
  cacheLife("max");
  return ask(SYSTEM_PROMPT, english, 4000);
}

/**
 * An automatic Arabic name for a show that isn't in data/titles-ar.ts yet, cached per title.
 * The /review page lists these so the owner can confirm them and move them into the file.
 * Returns null if the reply doesn't look like a short Arabic name.
 */
export async function arabicTitleFor(english: string | null, romaji: string): Promise<string | null> {
  "use cache";
  cacheLife("max");
  const name = await ask(TITLE_PROMPT, `English title: ${english ?? "(none)"}\nRomaji title: ${romaji}`, 200);
  const looksRight = name && !name.includes("\n") && name.length <= 80 && /[؀-ۿ]/.test(name);
  return looksRight ? name.replace(/^["«“]|["»”]$/g, "") : null;
}
