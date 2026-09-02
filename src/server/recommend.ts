import { getDb, type SpotRecord } from "@/server/db";
import {
  fromMins,
  minsInWindow,
  minutesUntilWindow,
  slotFromMins,
  trafficFactor,
  type DaySlot,
} from "@/server/time";

export type Weather = "sunny" | "rain" | "cloudy";

export type RankedSpot = {
  id: string;
  name: string;
  city: string;
  cityName: string;
  category: SpotRecord["category"];
  peak: string;
  crowd: number;
  liveCrowd: number;
  walkMins: number;
  cost: number;
  hidden: boolean;
  blurb: string;
  rating: number;
  reviews: number;
  durationMins: number;
  lat: number;
  lng: number;
  score: number;
  reason: string;
  when: "now" | "soon" | "later";
  minutesUntilPeak: number;
  nearby: boolean;
};

export type RecommendInput = {
  cityId: string;
  hourMins: number;
  weather?: Weather;
  crowdTolerance?: number;
  category?: SpotRecord["category"] | "All";
  limit?: number;
  includeNearby?: boolean;
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function liveCrowd(spot: SpotRecord, hourMins: number) {
  if (minsInWindow(hourMins, spot.peakStart, spot.peakEnd)) return spot.crowd;
  const until = minutesUntilWindow(hourMins, spot.peakStart, spot.peakEnd);
  if (until <= 60) return Math.round(spot.crowd * 0.75);
  return Math.round(spot.crowd * 0.48);
}

function categoryBoost(slot: DaySlot, category: SpotRecord["category"]) {
  if (slot === "dawn" && (category === "Nature" || category === "Spiritual")) return 22;
  if (slot === "morning" && (category === "Food" || category === "Spiritual" || category === "Nature"))
    return 16;
  if (slot === "afternoon" && (category === "Heritage" || category === "Craft")) return 16;
  if (slot === "evening" && (category === "Nature" || category === "Heritage" || category === "Food"))
    return 16;
  if (slot === "night" && category === "Food") return 28;
  if (slot === "night" && category !== "Food") return -18;
  return 0;
}

function weatherAdjust(weather: Weather, category: SpotRecord["category"]) {
  if (weather === "rain" && category === "Nature") return -45;
  if (weather === "rain" && (category === "Heritage" || category === "Craft" || category === "Food"))
    return 14;
  if (weather === "sunny" && category === "Nature") return 10;
  if (weather === "cloudy" && category === "Nature") return 4;
  return 0;
}

function reasonFor(spot: SpotRecord, hourMins: number, when: RankedSpot["when"], nearby: boolean) {
  const bits: string[] = [];
  if (when === "now") bits.push(`in its ${spot.peak} peak right now`);
  else if (when === "soon") bits.push(`peaks ${spot.peak} — about ${minutesUntilWindow(hourMins, spot.peakStart, spot.peakEnd)} min away`);
  else bits.push(`better later (${spot.peak})`);
  bits.push(`${spot.category.toLowerCase()}`);
  if (spot.hidden) bits.push("hidden gem");
  if (nearby) bits.push(`nearby in ${spot.cityName}`);
  return bits.join(" · ");
}

export function recommendSpots(input: RecommendInput): RankedSpot[] {
  const db = getDb();
  const city = db.cities.find((c) => c.id === input.cityId) ?? db.cities[0]!;
  const hourMins = ((input.hourMins % 1440) + 1440) % 1440;
  const weather = input.weather ?? "sunny";
  const crowdTolerance = input.crowdTolerance ?? 55;
  const limit = Math.min(16, Math.max(4, input.limit ?? 10));
  const slot = slotFromMins(hourMins);
  const includeNearby = input.includeNearby !== false;

  const pool: { spot: SpotRecord; nearby: boolean }[] = [];
  for (const s of db.spots) {
    if (s.city === city.id) pool.push({ spot: s, nearby: false });
  }
  if (includeNearby) {
    for (const s of db.spots) {
      if (s.city === city.id) continue;
      const km = haversineKm(city, s);
      if (km <= 45) pool.push({ spot: s, nearby: true });
    }
  }

  const ranked: RankedSpot[] = pool.map(({ spot, nearby }) => {
    const inPeak = minsInWindow(hourMins, spot.peakStart, spot.peakEnd);
    const until = minutesUntilWindow(hourMins, spot.peakStart, spot.peakEnd);
    const when: RankedSpot["when"] = inPeak ? "now" : until <= 90 ? "soon" : "later";
    const crowdNow = liveCrowd(spot, hourMins);

    let score = 72;
    if (inPeak) score += 42;
    else if (until <= 45) score += 26;
    else if (until <= 90) score += 12;
    else score -= Math.min(22, Math.floor(until / 60) * 4);

    score += categoryBoost(slot, spot.category);
    score += weatherAdjust(weather, spot.category);
    score -= Math.max(0, crowdNow - crowdTolerance) * 1.15;
    if (spot.hidden && crowdNow < 45) score += 16;
    score += (spot.rating - 3.5) * 22;
    score += Math.min(12, spot.reviews / 60);
    if (nearby) score -= 8;
    if (input.category && input.category !== "All" && spot.category !== input.category) score -= 50;
    score -= trafficFactor(hourMins) * 2;

    return {
      id: spot.id,
      name: spot.name,
      city: spot.city,
      cityName: spot.cityName,
      category: spot.category,
      peak: spot.peak,
      crowd: spot.crowd,
      liveCrowd: crowdNow,
      walkMins: spot.walkMins,
      cost: spot.cost,
      hidden: spot.hidden,
      blurb: spot.blurb,
      rating: spot.rating,
      reviews: spot.reviews,
      durationMins: spot.durationMins,
      lat: spot.lat,
      lng: spot.lng,
      score: Math.round(score * 10) / 10,
      reason: reasonFor(spot, hourMins, when, nearby),
      when,
      minutesUntilPeak: until,
      nearby,
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  const nowish = ranked.filter((r) => r.when === "now" || r.when === "soon");
  const later = ranked.filter((r) => r.when === "later");
  const merged = [...nowish, ...later];
  const seen = new Set<string>();
  const unique = merged.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  return unique.slice(0, limit);
}

export function recommendSummary(cityName: string, hourMins: number, rows: RankedSpot[]) {
  const slot = slotFromMins(hourMins);
  const clock = fromMins(hourMins);
  const now = rows.filter((r) => r.when === "now").slice(0, 4);
  const soon = rows.filter((r) => r.when === "soon").slice(0, 3);
  const parts = [`At ${clock} (${slot}) in ${cityName}, Localink ranks these stops.`];
  if (now.length) {
    parts.push(`Right now: ${now.map((r) => `${r.name} (${r.category.toLowerCase()}, peak ${r.peak})`).join("; ")}.`);
  }
  if (soon.length) {
    parts.push(`Opening into peak soon: ${soon.map((r) => r.name).join(", ")}.`);
  }
  if (!now.length && !soon.length && rows[0]) {
    parts.push(`Nothing is in peak this minute — the strongest nearby option is ${rows[0].name}.`);
  }
  return parts.join(" ");
}
