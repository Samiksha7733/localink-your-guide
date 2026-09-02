import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles, Mic, Map as MapIcon, Store, ArrowRight, Search } from "lucide-react";
import heroImg from "@/assets/hero-maharashtra.jpg";
import marketImg from "@/assets/local-market.jpg";
import { cities, spots } from "@/data/maharashtra";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Localink — Spontaneous Travel Across Maharashtra" },
      {
        name: "description",
        content:
          "Weather-aware micro-itineraries, a hyper-local AI concierge, live crowd heatmaps and searchable local spots across eight Maharashtra cities.",
      },
      { property: "og:title", content: "Localink — Spontaneous Travel Across Maharashtra" },
      {
        property: "og:description",
        content:
          "Dynamic micro-routes built from live weather, crowds, time of day and your remaining budget.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: Sparkles,
    title: "Spontaneous Itinerary Engine",
    body: "No static lists. Tell us the hour, the weather and what's left in your wallet — get a micro-route that reshuffles itself.",
    to: "/itinerary" as const,
  },
  {
    icon: Mic,
    title: "Sarathi — Hyper-Local Voice Guide",
    body: "A RAG-trained guide that knows the 1740 wada story, the shortcut lane and which stall shuts at 8.",
    to: "/concierge" as const,
  },
  {
    icon: MapIcon,
    title: "Interactive Geo Heatmaps",
    body: "Real-time popularity blobs, peak windows and walkable eco-routes drawn straight on the map.",
    to: "/map" as const,
  },
  {
    icon: Store,
    title: "Micro-Vendor Portal",
    body: "Bhel carts, kumbhar workshops and terrace kitchens can list a pop-up in under two minutes.",
    to: "/vendors" as const,
  },
];

function Index() {
  const hidden = spots.filter((s) => s.hidden).length;
  const [query, setQuery] = useState("");
  const [moreCityId, setMoreCityId] = useState("");

  const featured = useMemo(() => cities.filter((c) => c.featured), []);
  const others = useMemo(
    () => cities.filter((c) => !c.featured).sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const moreCity = others.find((c) => c.id === moreCityId);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { cities: featured, spots: [] as typeof spots };
    return {
      cities: cities.filter(
        (c) => c.name.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q),
      ),
      spots: spots
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.blurb.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q) ||
            cities.find((c) => c.id === s.city)!.name.toLowerCase().includes(q),
        )
        .slice(0, 6),
    };
  }, [query, featured]);


  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="Golden hour in a Maharashtra street market lane"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-dusk" />
        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-background/20 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-accent backdrop-blur">
            चला फिरायला · Maharashtra only
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight text-primary-foreground drop-shadow sm:text-6xl">
            Travel the way the day actually turns out.
          </h1>
          <p className="mt-5 max-w-xl text-base text-primary-foreground/90 sm:text-lg">
            Localink builds live micro-routes from the weather outside, the crowd inside and the
            money left in your UPI — across {cities.length} Maharashtra cities and {hidden}{" "}
            deliberately hidden corners.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/itinerary"
              className="inline-flex items-center gap-2 rounded-full bg-sunset px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
            >
              Build today's route <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 bg-background/10 px-6 py-3 text-sm font-semibold text-primary-foreground backdrop-blur transition-colors hover:bg-background/25"
            >
              See live crowd map
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">Four things we do differently</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="group rounded-2xl border border-border bg-card p-6 shadow-warm transition-transform hover:-translate-y-1"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="paisley-grid border-y border-border bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Cities we walk</h2>
          <p className="mt-2 text-muted-foreground">
            {featured.length} popular bases, plus {others.length} more towns across Maharashtra in
            the dropdown. Search a city, a dish or a category.
          </p>

          <label className="mt-6 flex max-w-xl items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-warm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Search locations</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try Nashik, Konkan beaches, misal, caves…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-xs font-medium text-primary"
              >
                Clear
              </button>
            )}
          </label>

          <label className="mt-4 flex max-w-xl flex-col gap-2 text-sm font-semibold">
            <span>More towns &amp; getaways</span>
            <select
              value={moreCityId}
              onChange={(e) => setMoreCityId(e.target.value)}
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-normal shadow-warm outline-none focus:border-primary"
            >
              <option value="">Pick from {others.length} more places…</option>
              {others.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {moreCity && (
            <article className="mt-6 grid max-w-3xl gap-4 overflow-hidden rounded-2xl border border-border bg-card shadow-warm sm:grid-cols-[220px_1fr]">
              <img
                src={moreCity.image}
                alt={`${moreCity.name}, Maharashtra`}
                loading="lazy"
                width={1024}
                height={768}
                className="h-44 w-full object-cover sm:h-full"
              />
              <div className="p-5">
                <h3 className="text-lg font-semibold">{moreCity.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{moreCity.tagline}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {moreCity.temp}°C · {moreCity.weather}
                </p>
                <Link
                  to="/itinerary"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary"
                >
                  Build a route here <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          )}

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {results.cities.map((c) => (
              <article
                key={c.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-warm"
              >
                <div className="relative h-44 overflow-hidden">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={`${c.name}, Maharashtra`}
                      loading="lazy"
                      width={1024}
                      height={768}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent">
                      <span className="px-4 text-center text-lg font-semibold text-primary-foreground">
                        {c.name}
                      </span>
                    </div>
                  )}
                  <span className="absolute right-3 top-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium backdrop-blur">
                    {c.temp}°C · {c.weather}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.tagline}</p>
                </div>
              </article>
            ))}
            {results.cities.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No city matches "{query}" yet — try a spot name or a category.
              </p>
            )}
          </div>

          {results.spots.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-semibold">Matching places</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.spots.map((s) => (
                  <Link
                    key={s.id}
                    to="/map"
                    className="rounded-xl border border-border bg-card p-4 text-sm shadow-warm transition-transform hover:-translate-y-0.5"
                  >
                    <p className="font-semibold">{s.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {cities.find((c) => c.id === s.city)!.name} · {s.category} · peak {s.peak}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{s.blurb}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <img
          src={marketImg}
          alt="A street vendor arranging vegetables and marigold garlands at a Maharashtra market"
          loading="lazy"
          width={1024}
          height={768}
          className="rounded-3xl border border-border object-cover shadow-lift"
        />
        <div>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Money that stays in the lane
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every stop on Localink can be hosted by the person who actually runs it — the vada pav
            cart at Dadar, the bamboo-craft co-op outside Ellora, the terrace poha kitchen in Karve
            Nagar. No commissions on the first fifty bookings.
          </p>
          <Link
            to="/vendors"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-warm transition-transform hover:-translate-y-0.5"
          >
            List your pop-up <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
