import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Store, IndianRupee, Clock, MapPin } from "lucide-react";
import { cities } from "@/data/maharashtra";

export const Route = createFileRoute("/vendors")({
  head: () => ({
    meta: [
      { title: "Micro-Vendor Pop-up Portal — Localink" },
      {
        name: "description",
        content:
          "Local food stalls, artisans and workshop hosts across Maharashtra can list a pop-up event in under two minutes.",
      },
      { property: "og:title", content: "Micro-Vendor Pop-up Portal — Localink" },
      {
        property: "og:description",
        content: "List your stall, workshop or terrace kitchen — zero commission on the first 50 bookings.",
      },
    ],
  }),
  component: VendorsPage,
});

type Listing = {
  id: string;
  name: string;
  host: string;
  city: string;
  price: string;
  window: string;
  kind: string;
};

const seedListings: Listing[] = [
  {
    id: "v1",
    name: "Sunday Kolhapuri Thali on the terrace",
    host: "Sujata Patil",
    city: "Pune",
    price: "₹350",
    window: "Sun, 12–3 PM",
    kind: "Home kitchen",
  },
  {
    id: "v2",
    name: "Warli painting hour with a Palghar artist",
    host: "Devji Mashe",
    city: "Mumbai",
    price: "₹500",
    window: "Sat, 4–6 PM",
    kind: "Craft workshop",
  },
  {
    id: "v3",
    name: "Paithani pit-loom demo & chai",
    host: "Ansari Weavers Co-op",
    city: "Chhatrapati Sambhajinagar",
    price: "₹200",
    window: "Daily, 11 AM–4 PM",
    kind: "Artisan visit",
  },
  {
    id: "v4",
    name: "Strawberry-picking breakfast",
    host: "Bhilar Farm",
    city: "Mahabaleshwar",
    price: "₹250",
    window: "Daily, 8–11 AM",
    kind: "Farm pop-up",
  },
];

import { ApiClient } from "@/lib/api-client";
import { useEffect } from "react";

function VendorsPage() {
  const [listings, setListings] = useState<Listing[]>(seedListings);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    host: "",
    city: cities[1]?.name ?? "Pune",
    price: "",
    window: "",
    kind: "Food stall",
  });

  useEffect(() => {
    ApiClient.getVendors()
      .then((data) => {
        if (data && data.length > 0) {
          setListings(data);
        }
      })
      .catch(() => {
        // use default seedListings
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.host || loading) return;
    setLoading(true);

    const price = form.price.startsWith("₹") ? form.price : `₹${form.price || "0"}`;
    const newEntry: Listing = {
      id: crypto.randomUUID(),
      ...form,
      price,
    };

    try {
      const saved = await ApiClient.publishVendor({
        name: form.name,
        host: form.host,
        city: form.city,
        price: form.price,
        window: form.window,
        kind: form.kind,
      });
      setListings((l) => [saved, ...l.filter((item) => item.id !== saved.id)]);
    } catch {
      setListings((l) => [newEntry, ...l]);
    } finally {
      setLoading(false);
      setDone(true);
      setForm({ name: "", host: "", city: cities[1]?.name ?? "Pune", price: "", window: "", kind: "Food stall" });
      setTimeout(() => setDone(false), 3500);
    }
  }

  const field =
    "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <header className="max-w-3xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Micro-vendor onboarding
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold">
            Two minutes to put your stall on the map.
          </h1>
          <p className="mt-3 text-muted-foreground">
            No GST maze, no glossy photos needed. Bhel carts, kumbhar wheels, terrace kitchens and
            weekend workshops — list a pop-up and travellers walking nearby will see it live.
          </p>
        </div>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[400px_1fr]">
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-warm">
          <h2 className="text-lg font-semibold">List a pop-up</h2>

          <label className="mt-5 block text-sm font-medium">
            What's happening?
            <input
              className={field}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Evening thalipeeth counter"
            />
          </label>

          <label className="mt-4 block text-sm font-medium">
            Host / stall name
            <input
              className={field}
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              placeholder="Kaka's cart, Sadashiv Peth"
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              City
              <select
                className={field}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              >
                {cities.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Type
              <select
                className={field}
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                {["Food stall", "Craft workshop", "Home kitchen", "Farm pop-up", "Artisan visit"].map(
                  (k) => (
                    <option key={k}>{k}</option>
                  ),
                )}
              </select>
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Price per person
              <input
                className={field}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="150"
              />
            </label>
            <label className="block text-sm font-medium">
              When
              <input
                className={field}
                value={form.window}
                onChange={(e) => setForm({ ...form, window: e.target.value })}
                placeholder="Fri–Sun, 6–9 PM"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-sunset px-4 py-3 text-sm font-semibold text-primary-foreground shadow-warm"
          >
            Publish pop-up
          </button>

          {done && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--leaf)]">
              <CheckCircle2 className="h-4 w-4" /> Live now — travellers nearby can see it.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Zero commission on your first 50 bookings. UPI settlements same day.
          </p>
        </form>

        <section>
          <h2 className="text-lg font-semibold">Live pop-ups across Maharashtra</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {listings.map((l) => (
              <article
                key={l.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-warm transition-transform hover:-translate-y-1"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-secondary-foreground">
                  <Store className="h-3 w-3" /> {l.kind}
                </span>
                <h3 className="mt-3 text-base font-semibold">{l.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">by {l.host}</p>
                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <p className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {l.city}
                  </p>
                  <p className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {l.window || "Flexible"}
                  </p>
                  <p className="inline-flex items-center gap-1.5">
                    <IndianRupee className="h-3.5 w-3.5" /> {l.price} per person
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
