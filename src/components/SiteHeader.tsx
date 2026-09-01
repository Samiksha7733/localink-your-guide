import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Compass } from "lucide-react";

const nav = [
  { to: "/itinerary", label: "Spontaneous Itinerary" },
  { to: "/concierge", label: "Sarathi AI Guide" },
  { to: "/map", label: "Live Heatmap" },
  { to: "/vendors", label: "Host a Pop-up" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[1000] border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sunset text-primary-foreground shadow-warm">
            <Compass className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold">Localink</span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Maharashtra, locally linked
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-border p-2 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 pb-4 pt-2 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
