/** Minutes from midnight helpers shared by the recommendation engine. */

export type DaySlot = "dawn" | "morning" | "afternoon" | "evening" | "night";

export function toMins(time: string) {
  const [h, m] = time.split(":").map(Number) as [number, number];
  return h * 60 + (m || 0);
}

export function fromMins(total: number) {
  const t = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  const m = t % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function slotFromMins(mins: number): DaySlot {
  const hour = Math.floor((((mins % 1440) + 1440) % 1440) / 60);
  if (hour < 6) return "dawn";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function parseClockToken(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\./g, "");
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ap = m[3];
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (!ap && h === 24) h = 0;
  return h * 60 + min;
}

/** Parse strings like "6–9 AM", "9 PM–1 AM", "11 AM–4 PM", "5:45–7 AM". */
export function parsePeakWindow(peak: string): { start: number; end: number } {
  const cleaned = peak.replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  const parts = cleaned.split("-").map((p) => p.trim());
  if (parts.length < 2) return { start: 9 * 60, end: 18 * 60 };

  const endHasAp = /am|pm/i.test(parts[1]!);
  const startHasAp = /am|pm/i.test(parts[0]!);
  let startRaw = parts[0]!;
  let endRaw = parts[1]!;

  if (!startHasAp && endHasAp) {
    const ap = endRaw.match(/am|pm/i)?.[0] ?? "";
    startRaw = `${startRaw} ${ap}`;
  }

  let start = parseClockToken(startRaw) ?? 9 * 60;
  let end = parseClockToken(endRaw) ?? 18 * 60;
  if (end <= start) end += 1440;
  return { start, end };
}

export function minsInWindow(mins: number, start: number, end: number) {
  const t = ((mins % 1440) + 1440) % 1440;
  const s = ((start % 1440) + 1440) % 1440;
  let e = end;
  if (e <= s) e += 1440;
  const t2 = t < s ? t + 1440 : t;
  return t2 >= s && t2 <= e;
}

export function minutesUntilWindow(mins: number, start: number, end: number) {
  if (minsInWindow(mins, start, end)) return 0;
  const t = ((mins % 1440) + 1440) % 1440;
  const s = ((start % 1440) + 1440) % 1440;
  return (s - t + 1440) % 1440;
}

export function trafficFactor(mins: number) {
  const hour = Math.floor((((mins % 1440) + 1440) % 1440) / 60);
  if ((hour >= 9 && hour < 12) || (hour >= 17 && hour < 21)) return 1.7;
  if ((hour >= 7 && hour < 9) || (hour >= 12 && hour < 17)) return 1.25;
  return 1;
}

export function trafficLabel(mins: number) {
  const f = trafficFactor(mins);
  return f >= 1.7 ? "Heavy traffic" : f > 1 ? "Moderate traffic" : "Clear roads";
}

export function monthName(date = new Date()) {
  return MONTHS[date.getMonth()]!;
}
