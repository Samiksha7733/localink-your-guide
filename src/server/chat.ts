import { getDb } from "@/server/db";
import { ensureKnowledge, type KnowledgeDoc } from "@/server/knowledge";
import { recommendSpots, recommendSummary, type RankedSpot } from "@/server/recommend";
import { slotFromMins, toMins } from "@/server/time";

export type ChatMessage = { role: "user" | "guide"; text: string };

export type ChatResult = {
  text: string;
  sources: string[];
  suggestions: RankedSpot[];
};

const STOP = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our",
  "out", "has", "have", "this", "that", "with", "from", "they", "what", "when", "where", "which",
  "your", "about", "into", "than", "then", "some", "them", "been", "more", "also", "just", "over",
  "after", "before", "tell", "give", "please", "could", "would", "should", "there", "here",
  "something", "anything", "in", "on", "at", "to", "of", "a", "an", "is", "it", "me", "my", "we",
]);

const SYNONYMS: Record<string, string> = {
  bombay: "mumbai",
  poona: "pune",
  aurangabad: "sambhajinagar",
  nasik: "nashik",
  saarthi: "sarathi",
  saarathi: "sarathi",
  chatbot: "sarathi",
  temple: "spiritual",
  darshan: "spiritual",
  breakfast: "morning",
  dinner: "evening",
  lunch: "afternoon",
  midnight: "night",
  late: "night",
  kebab: "food",
  misal: "food",
  beach: "nature",
  fort: "heritage",
  cave: "heritage",
  waterfall: "nature",
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((w) => SYNONYMS[w] ?? w)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function scoreDoc(tokens: string[], doc: KnowledgeDoc) {
  const hay = `${doc.title} ${doc.body} ${doc.tags.join(" ")}`.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (doc.tags.some((tag) => tag.includes(t) || t.includes(tag))) score += 6;
    if (doc.title.toLowerCase().includes(t)) score += 5;
    const hits = hay.split(t).length - 1;
    if (hits > 0) score += Math.min(8, hits * 2);
  }
  return score;
}

function detectCityId(question: string): string | undefined {
  const q = question.toLowerCase();
  const db = getDb();
  const hits = db.cities
    .map((c) => ({
      id: c.id,
      n: c.name.toLowerCase(),
    }))
    .filter((c) => q.includes(c.n) || q.includes(c.id.replace(/-/g, " ")));
  hits.sort((a, b) => b.n.length - a.n.length);
  return hits[0]?.id;
}

function wantsTimeSuggest(q: string) {
  return /now|right now|tonight|morning|evening|afternoon|dawn|midnight|night|today|hour|time|suggest|recommend|where should|what to do|kya kar|kuthe|best time/.test(
    q.toLowerCase(),
  );
}

function hourFromQuestion(question: string, fallbackMins: number) {
  const q = question.toLowerCase();
  const clock = q.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (clock) {
    let h = Number(clock[1]);
    const m = clock[2] ? Number(clock[2]) : 0;
    const ap = clock[3];
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return h * 60 + m;
  }
  if (/\b(midnight|late night|after midnight)\b/.test(q)) return 0;
  if (/\b(dawn|sunrise|early morning)\b/.test(q)) return 6 * 60;
  if (/\bmorning\b/.test(q)) return 9 * 60;
  if (/\bnoon|lunch|afternoon\b/.test(q)) return 13 * 60;
  if (/\bsunset|evening|dusk\b/.test(q)) return 18 * 60 + 30;
  if (/\bnight|tonight\b/.test(q)) return 21 * 60;
  return fallbackMins;
}

function scriptOf(question: string): "en" | "hi" {
  return /[\u0900-\u097F]/.test(question) ? "hi" : "en";
}

function composeAnswer(opts: {
  question: string;
  docs: KnowledgeDoc[];
  recs: RankedSpot[];
  cityName?: string;
  hourMins: number;
  includeRecs: boolean;
}): string {
  const { question, docs, recs, cityName, hourMins, includeRecs } = opts;
  const hi = scriptOf(question) === "hi";
  const greet = hi ? "नमस्कार! " : "";
  const top = docs.slice(0, 3);
  const slot = slotFromMins(hourMins);

  if (/^(hi|hello|hey|namaste|namaskar|नमस्कार|नमस्ते)\b/i.test(question.trim())) {
    return `${greet}I'm Sarathi, your Localink guide for Maharashtra. Ask about a lane, fort, stall, festival or the best hour to go — I'll answer from the local archive, not guesswork.`;
  }

  const chunks: string[] = [];
  if (hi) chunks.push("नमस्कार — उत्तर Localink च्या स्थानिक नोंदींवरून आहे.");

  if (top.length === 0 && recs.length === 0) {
    return `${greet}I only ground answers in Localink's Maharashtra archive. Try naming a city (Pune, Mumbai, Nashik…), a place (Shaniwar Wada, Ellora, misal), or a time (tonight in Mumbai).`;
  }

  for (const d of top) {
    const sentence = d.body.split(/(?<=\.)\s+/).slice(0, 3).join(" ");
    chunks.push(sentence);
  }

  if (includeRecs && recs.length) {
    chunks.push(
      recommendSummary(cityName ?? recs[0]!.cityName, hourMins, recs),
    );
    const extra = recs.slice(0, 6).map((r) => `• ${r.name} (${r.cityName}) — ${r.reason}. ${r.blurb}`);
    chunks.push(extra.join("\n"));
    chunks.push(`This ranking is for the ${slot} window. Change the hour and I'll reshuffle.`);
  }

  const text = chunks.join("\n\n").replace(/\n{3,}/g, "\n\n");
  if (text.length > 1600) return text.slice(0, 1590) + "…";
  return text;
}

export function answerQuestion(input: {
  question: string;
  cityId?: string;
  hourMins?: number;
  history?: ChatMessage[];
}): ChatResult {
  const question = input.question.trim();
  ensureKnowledge();
  const db = getDb();
  const hourMins = hourFromQuestion(question, input.hourMins ?? toMins(new Date().toTimeString().slice(0, 5)));
  const cityId = detectCityId(question) ?? input.cityId;
  const tokens = tokenize(question);

  const scored = db.knowledge
    .map((doc) => ({ doc, s: scoreDoc(tokens, doc) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  let docs = scored.slice(0, 5).map((x) => x.doc);
  if (cityId) {
    const cityBoost = scored.filter((x) => x.doc.cityIds.includes(cityId)).slice(0, 3);
    const merged = [...cityBoost.map((x) => x.doc), ...docs];
    const seen = new Set<string>();
    docs = merged.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    }).slice(0, 5);
  }

  const includeRecs = wantsTimeSuggest(question) || /spot|place|visit|go|do in/.test(question.toLowerCase());
  const recs = cityId
    ? recommendSpots({ cityId, hourMins, limit: 8, includeNearby: true })
    : includeRecs
      ? recommendSpots({ cityId: "pune", hourMins, limit: 6, includeNearby: true })
      : [];

  const cityName = cityId ? db.cities.find((c) => c.id === cityId)?.name : undefined;
  const text = composeAnswer({
    question,
    docs,
    recs: includeRecs ? recs : [],
    cityName,
    hourMins,
    includeRecs,
  });

  const sources = [
    ...new Set([
      ...docs.flatMap((d) => d.sources),
      ...(includeRecs ? ["Localink time-aware recommendation engine"] : []),
    ]),
  ].slice(0, 6);

  return {
    text,
    sources: sources.length ? sources : ["Localink Maharashtra corpus"],
    suggestions: includeRecs ? recs.slice(0, 6) : [],
  };
}
