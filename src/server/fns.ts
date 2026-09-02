import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { addVendor, getDb } from "@/server/db";
import { ensureKnowledge } from "@/server/knowledge";
import { answerQuestion } from "@/server/chat";
import { recommendSpots, recommendSummary } from "@/server/recommend";
import { toMins } from "@/server/time";

const weatherZ = z.enum(["sunny", "rain", "cloudy"]);
const categoryZ = z.enum(["All", "Food", "Heritage", "Nature", "Craft", "Spiritual"]);

const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.VITE_API_URL) || "http://localhost:8000/api/v1";

export const getRecommendations = createServerFn({ method: "POST" })
  .validator(
    z.object({
      cityId: z.string().min(1),
      time: z.string().optional(),
      hourMins: z.number().optional(),
      weather: weatherZ.optional(),
      crowdTolerance: z.number().min(0).max(100).optional(),
      category: categoryZ.optional(),
      limit: z.number().min(3).max(16).optional(),
      includeNearby: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // Try calling FastAPI backend first
    try {
      const res = await fetch(`${API_BASE_URL}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId: data.cityId,
          time: data.time,
          weather: data.weather,
          crowdTolerance: data.crowdTolerance,
          limit: data.limit,
          includeNearby: data.includeNearby,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        return {
          hourMins: json.hourMins,
          cityId: json.cityId,
          summary: json.summary,
          spots: json.spots,
        };
      }
    } catch {
      // fallback to in-memory engine
    }

    ensureKnowledge();
    const hourMins =
      data.hourMins ?? (data.time ? toMins(data.time) : toMins(new Date().toTimeString().slice(0, 5)));
    const spots = recommendSpots({
      cityId: data.cityId,
      hourMins,
      weather: data.weather,
      crowdTolerance: data.crowdTolerance,
      category: data.category,
      limit: data.limit,
      includeNearby: data.includeNearby,
    });
    const city = getDb().cities.find((c) => c.id === data.cityId);
    return {
      hourMins,
      cityId: data.cityId,
      summary: recommendSummary(city?.name ?? data.cityId, hourMins, spots),
      spots,
    };
  });

export const askSarathi = createServerFn({ method: "POST" })
  .validator(
    z.object({
      question: z.string().min(1).max(2000),
      cityId: z.string().optional(),
      time: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // Try calling FastAPI backend with Gemini API & RAG
    try {
      const res = await fetch(`${API_BASE_URL}/concierge/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: data.question,
          cityId: data.cityId,
          time: data.time,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        return {
          text: json.text,
          sources: json.sources,
          suggestions: json.suggestions,
        };
      }
    } catch {
      // fallback to in-memory engine
    }

    const hourMins = data.time
      ? toMins(data.time)
      : toMins(new Date().toTimeString().slice(0, 5));
    return answerQuestion({
      question: data.question,
      cityId: data.cityId,
      hourMins,
    });
  });

export const listVendors = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/vendors/`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // fallback
  }
  return getDb().vendors;
});

export const publishVendor = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1),
      host: z.string().min(1),
      city: z.string().min(1),
      price: z.string(),
      window: z.string(),
      kind: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const price = data.price.startsWith("₹") ? data.price : `₹${data.price || "0"}`;
    try {
      const res = await fetch(`${API_BASE_URL}/vendors/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          host: data.host,
          city: data.city,
          price,
          window: data.window,
          kind: data.kind,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }

    return addVendor({
      id: crypto.randomUUID(),
      name: data.name,
      host: data.host,
      city: data.city,
      price,
      window: data.window,
      kind: data.kind,
    });
  });
