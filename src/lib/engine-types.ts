export type RankedSpotCard = {
  id: string;
  name: string;
  cityName: string;
  reason: string;
  peak: string;
  category: string;
  hidden: boolean;
  cost: number;
  rating: number;
  durationMins: number;
  blurb: string;
  when: "now" | "soon" | "later";
  nearby: boolean;
  liveCrowd: number;
};
