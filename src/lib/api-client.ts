/**
 * Localink REST API Client
 * Connects the frontend to the FastAPI backend.
 */

const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.VITE_API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "https://localink-your-guide.onrender.com/api/v1";

export class ApiClient {
  private static token: string | null = null;

  static setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("localink_access_token", token);
      } else {
        localStorage.removeItem("localink_access_token");
      }
    }
  }

  static getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("localink_access_token");
    }
    return this.token;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");

    const token = this.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const parsed = JSON.parse(errorBody);
        errorDetail = parsed.detail || errorDetail;
      } catch {
        // use raw body
      }
      throw new Error(errorDetail);
    }

    return response.json() as Promise<T>;
  }

  // --- Health ---
  static async getHealth() {
    return this.request<{ status: string; service: string }>("/health");
  }

  // --- Auth ---
  static async register(data: { email: string; password: str; full_name: string; role?: string }) {
    const res = await this.request<{ access_token: string; refresh_token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    return res;
  }

  static async login(data: { email: string; password: str }) {
    const res = await this.request<{ access_token: string; refresh_token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    return res;
  }

  static async getMe() {
    return this.request<any>("/auth/me");
  }

  static logout() {
    this.setToken(null);
  }

  // --- Destinations & Spots ---
  static async getCities(featured?: boolean, query?: string) {
    const params = new URLSearchParams();
    if (featured !== undefined) params.set("featured", String(featured));
    if (query) params.set("query", query);
    return this.request<any[]>(`/destinations/cities?${params.toString()}`);
  }

  static async getSpots(params: { city_id?: string; category?: string; hidden?: boolean; query?: string }) {
    const q = new URLSearchParams();
    if (params.city_id) q.set("city_id", params.city_id);
    if (params.category && params.category !== "All") q.set("category", params.category);
    if (params.hidden !== undefined) q.set("hidden", String(params.hidden));
    if (params.query) q.set("query", params.query);
    return this.request<any[]>(`/spots/?${q.toString()}`);
  }

  static async getHeatmap(cityId: string, category?: string, ecoOnly?: boolean) {
    const q = new URLSearchParams({ city_id: cityId });
    if (category && category !== "All") q.set("category", category);
    if (ecoOnly) q.set("eco_only", "true");
    return this.request<any>(`/destinations/heatmap?${q.toString()}`);
  }

  // --- Recommendations & Itinerary ---
  static async getRecommendations(payload: {
    cityId: string;
    time?: string;
    weather?: string;
    budget?: number;
    interests?: string[];
    travelStyle?: string;
    crowdTolerance?: number;
    limit?: number;
    includeNearby?: boolean;
  }) {
    return this.request<any>("/recommendations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async generateItinerary(payload: {
    cityId: string;
    weather: string;
    startTime: string;
    endTime: string;
    groupSize: number;
    budget: number;
    wantGuide: boolean;
    crowdTolerance: number;
    seed?: number;
  }) {
    return this.request<any>("/itinerary/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async saveItinerary(payload: any) {
    return this.request<any>("/itinerary/save", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async getMyItineraries() {
    return this.request<any[]>("/itinerary/my-itineraries");
  }

  // --- Sarathi Concierge ---
  static async askSarathi(question: string, cityId?: string, time?: string, sessionId?: string) {
    return this.request<{ text: string; sources: string[]; suggestions: any[]; language: string; sessionId?: string }>(
      "/concierge/ask",
      {
        method: "POST",
        body: JSON.stringify({ question, cityId, time, sessionId }),
      }
    );
  }

  // --- Micro-Vendors ---
  static async getVendors(city?: string, kind?: string) {
    const q = new URLSearchParams();
    if (city) q.set("city", city);
    if (kind) q.set("kind", kind);
    return this.request<any[]>(`/vendors/?${q.toString()}`);
  }

  static async publishVendor(data: {
    name: string;
    host: string;
    city: string;
    price: string;
    window: string;
    kind: string;
    description?: string;
  }) {
    return this.request<any>("/vendors/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Tourist Guides ---
  static async getGuides(cityId?: string) {
    const q = new URLSearchParams();
    if (cityId) q.set("city_id", cityId);
    return this.request<any[]>(`/guides/?${q.toString()}`);
  }

  static async bookGuide(data: { guideId: string; cityId: string; date: string; hours: number; groupSize: number }) {
    return this.request<any>("/guides/book", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}
