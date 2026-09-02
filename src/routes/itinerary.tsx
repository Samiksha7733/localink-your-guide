import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Clock,
  Wallet,
  Users,
  RefreshCw,
  Footprints,
  Car,
  CloudRain,
  AlertTriangle,
  UserCheck,
  Star,
  Sparkles,
} from "lucide-react";
import { cities, spots, type CityId, type Spot } from "@/data/maharashtra";
import { MapCanvas } from "@/components/MapCanvas";
import { getRecommendations } from "@/server/fns";

export const Route = createFileRoute("/itinerary")({
  head: () => ({
    meta: [
      { title: "Spontaneous Itinerary Engine — Localink" },
      {
        name: "description",
        content:
          "Generate a live, minute-by-minute Maharashtra route from your start and end time, group size, budget, weather and live traffic.",
      },
      { property: "og:title", content: "Spontaneous Itinerary Engine — Localink" },
      {
        property: "og:description",
        content: "Time-boxed micro-routes that reshuffle with weather, traffic, crowds and budget.",
      },
    ],
  }),
  component: ItineraryPage,
});

type Weather = "sunny" | "rain" | "cloudy";
type Slot = "morning" | "afternoon" | "evening";

const MIN_BUDGET_PER_PERSON = 250;
const GUIDE_FEE_PER_HOUR = 300;

function toMins(time: string) {
  const [h, m] = time.split(":").map(Number) as [number, number];
  return h * 60 + m;
}

function fromMins(total: number) {
  const t = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  const m = t % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function slotFromMins(mins: number): Slot {
  const hour = Math.floor(mins / 60);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/** Live traffic multiplier applied to travel time, by hour of day. */
function trafficFactor(mins: number) {
  const hour = Math.floor(mins / 60);
  if ((hour >= 9 && hour < 12) || (hour >= 17 && hour < 21)) return 1.7;
  if ((hour >= 7 && hour < 9) || (hour >= 12 && hour < 17)) return 1.25;
  return 1;
}

function trafficLabel(mins: number) {
  const f = trafficFactor(mins);
  return f >= 1.7 ? "Heavy traffic" : f > 1 ? "Moderate traffic" : "Clear roads";
}

function fallbackScore(spot: Spot, weather: Weather, slot: Slot, crowdTolerance: number) {
  let s = 100;
  s -= Math.max(0, spot.crowd - crowdTolerance) * 1.2;
  if (weather === "rain" && spot.category === "Nature") s -= 45;
  if (weather === "rain" && (spot.category === "Heritage" || spot.category === "Craft")) s += 14;
  if (weather === "sunny" && spot.category === "Nature") s += 10;
  if (weather === "cloudy" && spot.category === "Nature") s += 4;
  if (slot === "morning" && spot.peak.includes("AM")) s += 18;
  if (slot === "evening" && spot.peak.includes("PM")) s += 14;
  if (slot === "afternoon" && spot.category === "Heritage") s += 12;
  if (spot.hidden) s += 16;
  s += (spot.rating - 3.5) * 22;
  s += Math.min(12, spot.reviews / 60);
  return s;
}

/** Deterministic local guides per city. */
function guidesFor(cityName: string) {
  const first = ["Aarti", "Sameer", "Nikita", "Rohan", "Prachi", "Imran", "Kaustubh", "Meera"];
  const langs = ["Marathi, Hindi, English", "Marathi, English", "Hindi, English, Konkani"];
  const focus = ["Heritage walks", "Food trails", "Nature & trekking", "Craft workshops"];
  const h = [...cityName].reduce((a, c) => a + c.charCodeAt(0), 0);
  return [0, 1, 2].map((i) => {
    const k = h + i * 17;
    return {
      id: `${cityName}-guide-${i}`,
      name: `${first[k % first.length]} ${["Deshpande", "Kulkarni", "Patil", "Shaikh"][k % 4]}`,
      languages: langs[k % langs.length]!,
      focus: focus[(k + i) % focus.length]!,
      rating: Math.round((4 + ((k % 10) / 10) * 0.9) * 10) / 10,
      feePerHour: GUIDE_FEE_PER_HOUR + (k % 3) * 100,
    };
  });
}

type Leg = {
  spot: Spot;
  arrive: number;
  depart: number;
  travelMins: number;
  cost: number;
};

function ItineraryPage() {
  const [cityId, setCityId] = useState<CityId>("pune");
  const [weather, setWeather] = useState<Weather>("sunny");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [groupSize, setGroupSize] = useState(1);
  const [budget, setBudget] = useState(1500);
  const [wantGuide, setWantGuide] = useState(false);
  const [crowdTolerance, setCrowdTolerance] = useState(55);
  const [seed, setSeed] = useState(0);

  const city = cities.find((c) => c.id === cityId) ?? cities[0]!;
  const start = toMins(startTime);
  const rawEnd = toMins(endTime);
  const end = rawEnd > start ? rawEnd : start + 60;
  const windowMins = end - start;
  const minBudget = MIN_BUDGET_PER_PERSON * groupSize;
  const effectiveBudget = Math.max(budget, minBudget);

  const recQuery = useQuery({
    queryKey: ["recommend", cityId, startTime, weather, crowdTolerance, seed],
    queryFn: () =>
      getRecommendations({
        data: {
          cityId,
          time: startTime,
          weather,
          crowdTolerance,
          limit: 14,
          includeNearby: true,
        },
      }),
  });

  const rankedIds = recQuery.data?.spots.map((s) => s.id) ?? [];

  const guides = useMemo(() => guidesFor(city.name), [city.name]);
  const guide = guides[0]!;
  const guideCost = wantGuide ? Math.ceil(windowMins / 60) * guide.feePerHour : 0;

  const plan = useMemo(() => {
    const spendable = Math.max(0, effectiveBudget - guideCost);
    const byId = new Map(spots.map((s) => [s.id, s]));
    const enginePool = rankedIds
      .map((id) => byId.get(id))
      .filter((s): s is Spot => Boolean(s));
    const rest = spots
      .filter((s) => s.city === cityId && !rankedIds.includes(s.id))
      .map((s) => ({
        s,
        v: fallbackScore(s, weather, slotFromMins(start), crowdTolerance) + ((seed * 7 + s.id.length) % 5),
      }))
      .sort((a, b) => b.v - a.v)
      .map((x) => x.s);
    const pool = [...enginePool, ...rest];

    const legs: Leg[] = [];
    const notes: string[] = [];
    let cursor = start;
    let spent = 0;

    for (const s of pool) {
      if (legs.length >= 6) break;
      const travelBase = legs.length === 0 ? 10 : Math.max(8, Math.round(s.walkMins * 0.8));
      const travel = Math.round(travelBase * trafficFactor(cursor));
      const stay = Math.max(30, s.durationMins);
      const arrive = cursor + travel;
      const depart = arrive + stay;
      const cost = s.cost * groupSize;

      if (depart > end) continue;
      if (spent + cost > spendable) {
        if (!notes.includes("budget-skip"))
          notes.push("budget-skip");
        continue;
      }
      legs.push({ spot: s, arrive, depart, travelMins: travel, cost });
      spent += cost;
      cursor = depart;
    }

    return { legs, spent, spendable };
  }, [
    cityId,
    weather,
    start,
    end,
    crowdTolerance,
    seed,
    groupSize,
    effectiveBudget,
    guideCost,
    rankedIds,
  ]);

  const { legs, spent } = plan;
  const totalCost = spent + guideCost;
  const walk = legs.reduce((a, l) => a + l.spot.walkMins, 0);
  const travelTotal = legs.reduce((a, l) => a + l.travelMins, 0);
  const finish = legs.length ? legs[legs.length - 1]!.depart : start;

  const limitations = useMemo(() => {
    const out: string[] = [];
    if (windowMins < 120)
      out.push("Your window is under 2 hours — the plan stays inside one neighbourhood.");
    if (rawEnd <= start) out.push("End time was before start time, so we assumed a 1-hour window.");
    if (budget < minBudget)
      out.push(
        `Minimum workable budget for ${groupSize} ${groupSize === 1 ? "person" : "people"} is ₹${minBudget} — we planned with that instead.`,
      );
    if (weather === "rain")
      out.push("Rain forecast: outdoor and nature stops were down-ranked in favour of covered ones.");
    if (trafficFactor(start) >= 1.7)
      out.push("You start in peak-hour traffic — travel times are padded by ~70%.");
    if (groupSize >= 6)
      out.push("Groups of 6+ should pre-book seating; some stalls can't seat you together.");
    if (end - finish > 90 && legs.length > 0)
      out.push(`About ${end - finish} min of your window is left unfilled by good options nearby.`);
    if (legs.length === 0)
      out.push("Nothing fits — widen the time window or raise the budget.");
    return out;
  }, [windowMins, rawEnd, start, budget, minBudget, groupSize, weather, end, finish, legs.length]);

  const alternates = useMemo(
    () =>
      spots
        .filter((s) => s.city === cityId && !legs.some((l) => l.spot.id === s.id))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3),
    [cityId, legs],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Context-aware engine
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold">A schedule, not a wishlist.</h1>
        <p className="mt-3 text-muted-foreground">
          Give us your window, your group and your budget. The recommendation engine times every
          stop around live traffic, weather, peak hours and crowd levels — and Sarathi can explain
          why.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-warm">
          <div>
            <label className="text-sm font-semibold" htmlFor="city">
              City or town
            </label>
            <select
              id="city"
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
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

          <div>
            <label className="text-sm font-semibold" htmlFor="weather">
              Weather right now
            </label>
            <select
              id="weather"
              value={weather}
              onChange={(e) => setWeather(e.target.value as Weather)}
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="sunny">Clear</option>
              <option value="cloudy">Cloudy</option>
              <option value="rain">Raining</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold" htmlFor="start">
                Start
              </label>
              <input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-semibold" htmlFor="end">
                End
              </label>
              <input
                id="end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <p className="-mt-3 text-xs text-muted-foreground">
            {Math.floor(windowMins / 60)}h {windowMins % 60}m window · {slotFromMins(start)} start ·{" "}
            {trafficLabel(start).toLowerCase()}
          </p>

          <div>
            <label className="text-sm font-semibold" htmlFor="group">
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" /> Who's coming
              </span>
            </label>
            <select
              id="group"
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value={1}>Solo</option>
              <option value={2}>Couple / 2 people</option>
              <option value={3}>3 people</option>
              <option value={4}>4 people</option>
              <option value={6}>Small group (6)</option>
              <option value={10}>Large group (10)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-semibold" htmlFor="budget">
              <span className="inline-flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Total budget
              </span>
              <span className="text-primary">₹{effectiveBudget}</span>
            </label>
            <input
              id="budget"
              type="number"
              min={minBudget}
              step={50}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value) || 0)}
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <p className={`mt-2 text-xs ${budget < minBudget ? "text-destructive" : "text-muted-foreground"}`}>
              Minimum ₹{minBudget} for {groupSize === 1 ? "1 traveller" : `${groupSize} travellers`} (₹
              {MIN_BUDGET_PER_PERSON} each).
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <label className="flex items-start gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={wantGuide}
                onChange={(e) => setWantGuide(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--primary)]"
              />
              <span>
                Add a local tourist guide
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  ₹{guide.feePerHour}/hour · billed for the whole window
                </span>
              </span>
            </label>
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-semibold">
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" /> Crowd tolerance
              </span>
              <span className="text-primary">{crowdTolerance}%</span>
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={crowdTolerance}
              onChange={(e) => setCrowdTolerance(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--primary)]"
            />
          </div>

          <button
            onClick={() => setSeed((s) => s + 1)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sunset px-4 py-3 text-sm font-semibold text-primary-foreground shadow-warm"
          >
            <RefreshCw className="h-4 w-4" /> Regenerate schedule
          </button>
        </aside>

        <section className="space-y-6">
          <MapCanvas city={city} spots={legs.map((l) => l.spot)} route={legs.map((l) => l.spot)} height={380} />

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Stops", value: legs.length },
              { label: "Spend", value: `₹${totalCost} / ₹${effectiveBudget}` },
              { label: "In transit", value: `${travelTotal} min` },
              { label: "Ends", value: fromMins(finish) },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-border bg-card p-4 shadow-warm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
                <p className="mt-1 text-lg font-semibold">{k.value}</p>
              </div>
            ))}
          </div>

          {recQuery.data && recQuery.data.spots.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-warm">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> More spots at {startTime}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{recQuery.data.summary}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {recQuery.data.spots.slice(0, 10).map((s) => (
                  <li key={s.id} className="rounded-xl border border-border p-3 text-sm">
                    <p className="font-medium">
                      {s.name}
                      {s.nearby ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">Nearby</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.when === "now" ? "Good now" : s.when === "soon" ? "Peak soon" : "Better later"}{" "}
                      · {s.peak} · ★ {s.rating} · {s.cost === 0 ? "Free" : `₹${s.cost}`}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {limitations.length > 0 && (
            <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 text-accent" /> Limitations in this plan
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {limitations.map((l) => (
                  <li key={l}>• {l}</li>
                ))}
              </ul>
            </div>
          )}

          <ol className="space-y-4">
            {legs.map((l, i) => (
              <li
                key={l.spot.id}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-warm"
              >
                <div className="w-20 shrink-0">
                  <p className="text-sm font-semibold text-primary">{fromMins(l.arrive)}</p>
                  <p className="text-xs text-muted-foreground">to {fromMins(l.depart)}</p>
                  <span className="mt-2 flex h-7 w-7 items-center justify-center rounded-full bg-sunset text-xs font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{l.spot.name}</h3>
                    {l.spot.hidden && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                        Hidden gem
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{l.spot.blurb}</p>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Car className="h-3.5 w-3.5" /> {l.travelMins} min travel ·{" "}
                      {trafficLabel(l.arrive - l.travelMins).toLowerCase()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5" /> {l.spot.rating} ({l.spot.reviews})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {l.spot.crowd}% busy
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Footprints className="h-3.5 w-3.5" /> {l.spot.walkMins} min walk
                    </span>
                    <span>{l.cost === 0 ? "Free" : `₹${l.cost} for the group`}</span>
                    {weather === "rain" && l.spot.category === "Nature" && (
                      <span className="inline-flex items-center gap-1 text-accent">
                        <CloudRain className="h-3.5 w-3.5" /> Carry a raincoat
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
            {legs.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nothing fits this window and budget — stretch the end time or raise the budget.
              </li>
            )}
          </ol>

          {alternates.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-warm">
              <p className="text-sm font-semibold">If something falls through, swap in</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {alternates.map((a) => (
                  <li key={a.id} className="rounded-xl border border-border p-3 text-sm">
                    <p className="font-medium">{a.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ★ {a.rating} · {a.durationMins} min · {a.cost === 0 ? "Free" : `₹${a.cost}`}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5 shadow-warm">
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <UserCheck className="h-4 w-4 text-primary" /> Tourist guides available in {city.name}
            </p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {guides.map((g) => (
                <li key={g.id} className="rounded-xl border border-border p-4">
                  <p className="font-semibold">{g.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{g.focus}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{g.languages}</p>
                  <p className="mt-2 text-xs font-medium text-primary">
                    ★ {g.rating} · ₹{g.feePerHour}/hr
                  </p>
                </li>
              ))}
            </ul>
            {wantGuide && (
              <p className="mt-4 text-xs text-muted-foreground">
                <Clock className="mr-1 inline h-3.5 w-3.5" />
                {guide.name} is booked for your full window — ₹{guideCost} added to the total.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
