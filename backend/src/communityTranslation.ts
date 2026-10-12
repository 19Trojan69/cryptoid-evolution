import { createHash } from "node:crypto";
import { detectAll } from "tinyld";

export const communityLanguages = new Set([
  "en",
  "de",
  "es",
  "fr",
  "pt",
  "it",
  "pl",
  "tr",
  "ru",
  "hr",
  "cs",
  "sk",
  "hu",
  "ro",
  "sr",
  "uk",
  "th",
  "zh",
  "vi",
]);
export const communityLocale = (value: unknown) =>
  typeof value === "string" &&
  communityLanguages.has(value.toLowerCase().split("-")[0])
    ? value.toLowerCase().split("-")[0]
    : null;
export const translationKey = (
  network: string,
  id: string,
  locale: string,
  fields: string[],
) =>
  createHash("sha256")
    .update(JSON.stringify([network, id, locale, fields]))
    .digest("hex");
export const translationChunks = (text: string) => {
  const chunks: string[] = [];
  let current = "";
  for (const character of text) {
    if (Buffer.byteLength(current + character, "utf8") > 450) {
      // Prefer whole words while preserving every original character.
      const boundary =
        Math.max(current.lastIndexOf(" "), current.lastIndexOf("\n")) + 1;
      if (boundary >= current.length / 2) {
        chunks.push(current.slice(0, boundary));
        current = current.slice(boundary);
      } else {
        chunks.push(current);
        current = "";
      }
    }
    current += character;
  }
  if (current) chunks.push(current);
  return chunks;
};
export type CommunityTranslation = {
  fields: string[];
  translated: boolean;
  locale: string;
};
const pending = new Map<string, Promise<CommunityTranslation>>();
const recent = new Map<string, CommunityTranslation>();
let active = 0;
const waiters: (() => void)[] = [];
async function slot() {
  if (active < 3) {
    active++;
    return;
  }
  if (waiters.length >= 90) throw new Error("translation_busy");
  await new Promise<void>((resolve) => waiters.push(resolve));
}
function release() {
  const next = waiters.shift();
  if (next) next();
  else active--;
}

export async function translateCommunity(
  fields: string[],
  locale: string,
  fetcher: typeof fetch = fetch,
): Promise<CommunityTranslation> {
  const key = translationKey("text", "", locale, fields);
  const cached = recent.get(key);
  if (cached) return cached;
  const ongoing = pending.get(key);
  if (ongoing) return ongoing;
  const job = (async () => {
    const source = fields.join("\n").trim();
    const detected = detectAll(source)[0];
    if (!source || (detected?.lang === locale && detected.accuracy >= 0.65))
      return { fields, translated: false, locale };
    // Public community text only. No usernames, account details or credentials.
    const translated: string[] = [];
    let failed = false;
    const deadline = Date.now() + 30_000;
    for (const field of fields) {
      const chunks = translationChunks(field);
      const results = await Promise.all(
        chunks.map(async (chunk) => {
          if (!/[\p{L}]/u.test(chunk)) return chunk;
          await slot();
          try {
            if (failed || Date.now() >= deadline)
              throw new Error("translation_timeout");
            const url = new URL("https://api.mymemory.translated.net/get");
            url.searchParams.set("q", chunk);
            url.searchParams.set(
              "langpair",
              `autodetect|${locale === "zh" ? "zh-CN" : locale}`,
            );
            const response = await fetcher(url, {
              signal: AbortSignal.timeout(
                Math.min(8000, deadline - Date.now()),
              ),
            });
            if (!response.ok) throw new Error("translation_unavailable");
            const data = (await response.json()) as any;
            const value = data.responseData?.translatedText;
            if (
              Number(data.responseStatus) !== 200 ||
              data.quotaFinished ||
              typeof value !== "string" ||
              !value.trim()
            )
              throw new Error("translation_unavailable");
            return value;
          } catch (error) {
            failed = true;
            throw error;
          } finally {
            release();
          }
        }),
      );
      translated.push(results.join(" "));
    }
    const result = {
      fields: translated,
      translated: translated.some((text, index) => text !== fields[index]),
      locale,
    };
    recent.set(key, result);
    if (recent.size > 128) recent.delete(recent.keys().next().value!);
    return result;
  })();
  pending.set(key, job);
  try {
    return await job;
  } finally {
    pending.delete(key);
  }
}
