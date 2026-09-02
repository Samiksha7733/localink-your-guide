import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Leaf, Flame, Clock, Search, Sparkles } from "lucide-react";
import { cities, spots, type CityId } from "@/data/maharashtra";
import { MapCanvas } from "@/components/MapCanvas";
import { getRecommendations } from "@/server/fns";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Live Crowd Heatmap — Localink Maharashtra" },
      {
        name: "description",
        content:
          "Interactive geo-spatial heatmaps of real-time popularity, peak hours and eco-friendly walkable routes across Maharashtra.",
      },
      { property: "og:title", content: "Live Crowd Heatmap — Localink Maharashtra" },
      {
        property: "og:description",
        content: "See what's packed, what's calm and which route you can walk instead of drive.",
      },
    ],
  }),
  component: MapPage,
});

const categories = ["All", "Food", "Heritage", "Nature", "Craft", "Spiritual"] as const;

function MapPage() {
  const [cityId, setCityId] = useState<CityId>("mumbai");
  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const [ecoOnly, setEcoOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [hour, setHour] = useState(() => new Date().toTimeString().slice(0, 5));

  const city = cities.find((c) => c.id === cityId)!;

  const visible = useMemo(
    () =>
      spots.filter(
        (s) =>
          s.city === cityId &&
          (cat === "All" || s.category === cat) &&
          (!ecoOnly || s.walkMins <= 30) &&
          (query.trim() === "" ||
            s.name.toLowerCase().includes(query.trim().toLowerCase()) ||
            s.blurb.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [cityId, cat, ecoOnly, query],
  );

  const ecoRoute = useMemo(
    () => (ecoOnly ? [...visible].sort((a, b) => a.walkMins - b.walkMins) : []),
    [ecoOnly, visible],
  );

  const avgCrowd = visible.length
    ? Math.round(visible.reduce((a, s) => a + s.crowd, 0) / visible.length)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Real-time geo-spatial layer
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold">Where the crowd is — right now.</h1>
        <p className="mt-3 text-muted-foreground">
          Bubble size and colour track live popularity. Turn on walkability to draw an eco-route
          you can finish on foot.
        </p>
      </header>

      <label className="mt-8 flex max-w-xl items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-warm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="sr-only">Search a location</span>
        <input
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            const hit = cities.find((c) => c.name.toLowerCase().includes(v.trim().toLowerCase()));
            if (v.trim() && hit) setCityId(hit.id);
          }}
          placeholder="Search a city or a spot — Nashik, Ellora, beach…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="mt-4 max-w-xs">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="heatmap-city">
          Choose a city or town
        </label>
        <select
          id="heatmap-city"
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <optgroup label="Popular">
            {cities
              .filter((c) => c.featured)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </optgroup>
          <optgroup label="More towns">
            {cities
              .filter((c) => !c.featured)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </optgroup>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              c === cat ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card"
            }`}
          >
            {c}
          </button>
        ))}
        <button
          onClick={() => setEcoOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
            ecoOnly ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
          }`}
        >
          <Leaf className="h-3.5 w-3.5" /> Walkable eco-route
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <MapCanvas city={city} spots={visible} route={ecoRoute} height={520} />

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-warm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {city.name} right now
            </p>
            <p className="mt-1 text-3xl font-semibold">{avgCrowd}%</p>
            <p className="text-sm text-muted-foreground">
              average footfall across {visible.length} spots · {city.temp}°C {city.weather}
            </p>
            <div className="mt-4 space-y-2 text-xs">
              {[
                ["Packed (70%+)", "bg-destructive"],
                ["Steady (45–69%)", "bg-[var(--saffron)]"],
                ["Calm (under 45%)", "bg-[var(--leaf)]"],
              ].map(([label, cls]) => (
                <p key={label} className="flex items-center gap-2 text-muted-foreground">
                  <span className={`h-3 w-3 rounded-full ${cls}`} /> {label}
                </p>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {visible.map((s) => (
              <div key={s.id} className="rounded-2xl border border-border bg-card p-4 shadow-warm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{s.name}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Flame className="h-3.5 w-3.5 text-primary" />
                    {s.crowd}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-sunset" style={{ width: `${s.crowd}%` }} />
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Peak {s.peak} · {s.walkMins} min on foot
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
