import { lazy, Suspense, useEffect, useState } from "react";
import type { City, Spot } from "@/data/maharashtra";

const LiveMap = lazy(() => import("./LiveMap"));

type Props = {
  city: City;
  spots: Spot[];
  route?: Spot[];
  height?: number;
};

export function MapCanvas({ height = 460, ...props }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const skeleton = (
    <div
      className="flex animate-pulse items-center justify-center rounded-2xl border border-border bg-muted text-sm text-muted-foreground"
      style={{ height }}
    >
      Warming up the map…
    </div>
  );

  if (!mounted) return skeleton;

  return (
    <Suspense fallback={skeleton}>
      <LiveMap {...props} height={height} />
    </Suspense>
  );
}
