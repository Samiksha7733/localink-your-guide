import { cities, spots, type City, type Spot } from "@/data/maharashtra";
import { parsePeakWindow } from "@/server/time";

export type KnowledgeDoc = {
  id: string;
  title: string;
  body: string;
  sources: string[];
  cityIds: string[];
  tags: string[];
};

export type VendorRow = {
  id: string;
  name: string;
  host: string;
  city: string;
  price: string;
  window: string;
  kind: string;
};

export type SpotRecord = Spot & {
  cityName: string;
  peakStart: number;
  peakEnd: number;
};

type LocalinkDb = {
  cities: City[];
  spots: SpotRecord[];
  knowledge: KnowledgeDoc[];
  vendors: VendorRow[];
};

const g = globalThis as typeof globalThis & { __localinkDb?: LocalinkDb };

const seedVendors: VendorRow[] = [
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

function buildSpotRecords(): SpotRecord[] {
  const cityName = new Map(cities.map((c) => [c.id, c.name]));
  return spots.map((s) => {
    const win = parsePeakWindow(s.peak);
    return {
      ...s,
      cityName: cityName.get(s.city) ?? s.city,
      peakStart: win.start,
      peakEnd: win.end,
    };
  });
}

export function getDb(): LocalinkDb {
  if (!g.__localinkDb) {
    g.__localinkDb = {
      cities,
      spots: buildSpotRecords(),
      knowledge: [],
      vendors: [...seedVendors],
    };
  }
  return g.__localinkDb;
}

export function setKnowledge(docs: KnowledgeDoc[]) {
  getDb().knowledge = docs;
}

export function addVendor(row: VendorRow) {
  getDb().vendors.unshift(row);
  return row;
}
