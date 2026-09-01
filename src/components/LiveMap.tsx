import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip } from "react-leaflet";
import type { City, Spot } from "@/data/maharashtra";

type Props = {
  city: City;
  spots: Spot[];
  route?: Spot[];
  height?: number;
};

function heatColor(crowd: number) {
  if (crowd >= 70) return "var(--destructive)";
  if (crowd >= 45) return "var(--saffron)";
  return "var(--leaf)";
}

export default function LiveMap({ city, spots, route = [], height = 460 }: Props) {
  return (
    <MapContainer
      key={city.id}
      center={[city.lat, city.lng]}
      zoom={12}
      scrollWheelZoom
      style={{ height, width: "100%" }}
      className="rounded-2xl border border-border shadow-warm"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />


      {route.length > 1 && (
        <Polyline
          positions={route.map((s) => [s.lat, s.lng] as [number, number])}
          pathOptions={{ color: "var(--terracotta)", weight: 4, dashArray: "10 8", opacity: 0.9 }}
        />
      )}

      {spots.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lng]}
          radius={10 + s.crowd / 6}
          pathOptions={{
            color: heatColor(s.crowd),
            fillColor: heatColor(s.crowd),
            fillOpacity: 0.28,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {s.name} · {s.crowd}% busy
          </Tooltip>
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.blurb}</p>
              <p className="text-xs text-foreground">
                Peak {s.peak} · {s.walkMins} min walk · {s.cost === 0 ? "Free" : `₹${s.cost}`}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
