import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-semibold">Localink</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Slow, spontaneous travel across Maharashtra — built for Indian travellers, local
            vendors and the lanes the tour buses miss.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Explore</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link to="/itinerary" className="hover:text-foreground">
                Spontaneous Itinerary Engine
              </Link>
            </li>
            <li>
              <Link to="/map" className="hover:text-foreground">
                Geo-spatial Heatmaps
              </Link>
            </li>
            <li>
              <Link to="/concierge" className="hover:text-foreground">
                Sarathi AI Guide
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Cities covered</p>
          <p className="mt-3 text-muted-foreground">
            Mumbai · Pune · Chhatrapati Sambhajinagar · Mahabaleshwar · Nashik · Kolhapur · Nagpur · Ratnagiri
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Localink. Made in Maharashtra.
          </p>
        </div>
      </div>
    </footer>
  );
}
