import { getDb, setKnowledge, type KnowledgeDoc } from "@/server/db";

const curated: KnowledgeDoc[] = [
  {
    id: "k-sarathi",
    title: "Who is Sarathi (Saarthi)",
    body: "Sarathi — also spelled Saarthi or Saarathi — is Localink's hyper-local travel concierge for Maharashtra. Sarathi answers in English, Hindi and Marathi using Localink's own archive: gazetteers, temple records, vendor interviews and the live spot database (peak hours, walk times, costs, crowd levels). Sarathi does not invent places outside Maharashtra. Ask about forts, food lanes, hidden spots, best hours, budgets, crowds or how to stitch a same-day route.",
    sources: ["Localink product notes", "Sarathi concierge brief"],
    cityIds: [],
    tags: ["sarathi", "saarthi", "saarathi", "chatbot", "localink", "guide", "who"],
  },
  {
    id: "k-localink",
    title: "What Localink does",
    body: "Localink builds spontaneous micro-itineraries for Maharashtra. The itinerary engine uses your start and end time, group size, budget, weather and crowd tolerance. The map shows live-style popularity blobs and walkable eco-routes. The vendor portal lists pop-up stalls and workshops. Money is meant to stay with the person who actually runs the stall. Minimum workable budget on the itinerary page is ₹250 per person.",
    sources: ["Localink itinerary engine", "Vendor portal copy"],
    cityIds: [],
    tags: ["localink", "itinerary", "budget", "map", "vendor", "app"],
  },
  {
    id: "k-shaniwar",
    title: "Shaniwar Wada, Pune",
    body: "Shaniwar Wada was built in 1732 by Bajirao I as the Peshwa seat in Pune. A seven-storey palace once stood inside; the 1828 fire left the massive base and fortifications. The Delhi Darwaza still shows elephant-proof spikes. Locals gather around 6:30 PM for the sound-and-light show. The quieter entrance is the Mastani Darwaza on the north side. Pair it with Tulshibaug lanes or Dagadusheth Halwai in the old city. Typical ticket for the light show is modest (around ₹50 on Localink listings). Best evening window: 6:30–8 PM; mornings are calmer for photographs of the walls.",
    sources: ["Pune Gazetteer, 1885", "ASI site record PN-14", "Oral history: Kasba Peth guides"],
    cityIds: ["pune"],
    tags: ["shaniwar", "wada", "peshwa", "bajirao", "mastani", "pune", "heritage", "story", "history"],
  },
  {
    id: "k-mumbai-night",
    title: "Where locals eat in Mumbai after midnight",
    body: "Bhendi Bazaar and Mohammed Ali Road stay awake until about 2 AM. Order baida roti at Suleman-style counters and malpua with rabdi a lane or two down. Nalli nihari appears late. For a calmer option, Sassoon Dock chai stalls open around 4–5 AM for fisherfolk and pour very strong cutting chai. Colaba and Bandra stay lively but the old-city meat lanes are the real after-midnight table. Peak crowd on Mohammed Ali Road is 10 PM–2 AM. Go hungry; portions are large and spicy.",
    sources: ["Localink vendor network", "BMC night-market permits 2026"],
    cityIds: ["mumbai"],
    tags: ["midnight", "night", "mumbai", "eat", "food", "kebab", "baida", "malpua", "mohammed", "bhendi", "late"],
  },
  {
    id: "k-ellora-hidden",
    title: "Hidden and quieter corners near Ellora",
    body: "Most visitors queue only at Ellora Cave 16 (Kailasa), carved top-down from one rock. For a quieter hour, start with the Paithani weavers' courtyard in Chhatrapati Sambhajinagar (formerly Aurangabad) — a single saree can take nine months on a pit loom. Then go to Ellora Cave 29 (Dhumar Lena) around 4 PM, when western light hits the lingam chamber and tour buses have thinned. Ajanta is a separate gorge further north; go at opening (6–9 AM) for empty painted caves. Bibi Ka Maqbara is best in the last twenty minutes of gold light (5–7 PM).",
    sources: ["Paithani Weavers' Co-op", "ASI Ellora conservation notes"],
    cityIds: ["chhatrapati-sambhajinagar", "ajanta"],
    tags: ["ellora", "hidden", "kailasa", "cave", "paithani", "ajanta", "aurangabad", "sambhajinagar", "dhumar"],
  },
  {
    id: "k-mumbai",
    title: "Mumbai in a day — by hour",
    body: "Dawn (4–7 AM): Sassoon Dock fish auction and Banganga Tank. Morning (8–11 AM): Khotachiwadi wooden hamlet, Sewri flamingos in winter on a rising tide. Midday (10 AM–1 PM): Crawford Market spice halls, then indoor heritage at Kala Ghoda. Evening (5:30–8 PM): Marine Drive sundowner, Bandra Bandstand. Late night (10 PM–2 AM): Bhendi Bazaar kebabs and Mohammed Ali Road. Walkable Fort and Colaba loops beat taxis in peak traffic (9–12 and 5–9 PM).",
    sources: ["Localink Mumbai corpus", "Spot peak windows"],
    cityIds: ["mumbai"],
    tags: ["mumbai", "bombay", "itinerary", "morning", "evening", "night", "marine", "flamingo", "khotachiwadi"],
  },
  {
    id: "k-pune",
    title: "Pune in a day — by hour",
    body: "Sunrise: Sinhagad fort ridge and pithla-bhakri; or Vetal Tekdi for peacocks. Breakfast: Bhandarkar / Deccan misal (8–11 AM) with buttermilk. Mid-morning: Pataleshwar rock cave off JM Road (8th-century basalt, still quiet). Afternoon: Osho Teerth garden in Koregaon Park. Evening: Shaniwar Wada sound-and-light ~6:30 PM, Dagadusheth aarti 7–9 PM, FC Road cafes 6–10 PM. Tulshibaug bangle bylanes peak 5–8 PM. Rainy days: prefer Pataleshwar, wadas and cafes over Sinhagad.",
    sources: ["Localink Pune corpus", "Kasba Peth guides"],
    cityIds: ["pune"],
    tags: ["pune", "poona", "misal", "sinhagad", "pataleshwar", "dagadusheth", "fc", "itinerary"],
  },
  {
    id: "k-konkan",
    title: "Konkan and Ratnagiri",
    body: "Ratnagiri is alphonso (hapus) country in season (typically late March–May). Thibaw Palace looks over the sea — Burma's exiled king watched this coast for 25 years; go 4–6 PM. Aare Ware are twin crescent beaches split by a cliff road. Ganpatipule has a swayambhu Ganesh on the sand; dawn aarti then a swim, not noon. Mandvi jetty is the lunch window for catch-of-the-day thalis (12–3 PM). Bhatye beach is quieter after dark. Further south: Sindhudurg/Malvan for Tarkarli water, Sawantwadi for ganjifa cards, Amboli for monsoon waterfalls.",
    sources: ["Konkan gazetteer notes", "Localink coastal spots"],
    cityIds: ["ratnagiri", "ganpatipule", "sindhudurg-malvan"],
    tags: ["konkan", "ratnagiri", "alphonso", "hapus", "beach", "ganpatipule", "mango", "sea"],
  },
  {
    id: "k-nashik",
    title: "Nashik, vineyards and ghats",
    body: "Ramkund ghat aarti on the Godavari is 6–8 PM. Panchavati (Sita Gufa, Kalaram) is calmer 6–9 AM. Sula and other Gangapur vineyards are a late-afternoon tasting (4–7 PM) when the backwaters turn copper — this is one of the costlier Localink stops (~₹900). Pandavleni Buddhist caves: climb 7–10 AM. Trimbakeshwar jyotirlinga at the Godavari source is better 6–8:30 PM than in the noon crush. Old-city wada breakfast (misal, poha) 7:30–10:30 AM before walking to Ramkund.",
    sources: ["Nashik district notes", "Localink vineyard listings"],
    cityIds: ["nashik", "trimbakeshwar"],
    tags: ["nashik", "nasik", "sula", "wine", "godavari", "ramkund", "trimbak", "vineyard"],
  },
  {
    id: "k-kolhapur",
    title: "Kolhapur food and Mahalaxmi",
    body: "Mahalaxmi kakad aarti is 5–7 AM, before queues form. Tambda–pandhra rassa (two mutton broths) is a lunch row, 12–3 PM, very spicy. Rankala lake loop is 5:30–8 PM. Chappal karagir workshops run 11 AM–5 PM — third-generation makers will stitch in front of you. New Palace museum is a quiet 10 AM–1 PM indoor hour. Night bazaar around the temple 7–10 PM for silver and kolhapuris. Pair a morning aarti with a midday thali and an evening lake walk.",
    sources: ["Kolhapur temple notices", "Karagir interviews"],
    cityIds: ["kolhapur"],
    tags: ["kolhapur", "mahalaxmi", "tambda", "rassa", "chappal", "rankala", "spicy"],
  },
  {
    id: "k-nagpur",
    title: "Nagpur oranges and evenings",
    body: "Nagpur is hot by late morning. Itwari orange wholesale is 6–9 AM with kadak cutting chai. Ambazari lake walk 6–8 AM before heat. Deekshabhoomi, India's largest hollow stupa, is dignified at 5–7 PM. Futala lake promenade 6–9 PM with fountains. Zero Mile marker is a short heritage stop 9 AM–12 PM. Sitabuldi fort rampart 5–7 PM. Sadar khau galli 8–11:30 PM. Winter (Nov–Feb) is the santra season. Tadoba tigers are reached via Chandrapur, not the city centre.",
    sources: ["Nagpur municipal notes", "Localink Vidarbha corpus"],
    cityIds: ["nagpur"],
    tags: ["nagpur", "orange", "santra", "deekshabhoomi", "futala", "itwari", "heat"],
  },
  {
    id: "k-mahabaleshwar",
    title: "Mahabaleshwar hills",
    body: "Wilson Point is the first sunrise (5:45–7:15 AM) — cold on the ridge. Strawberry farm breakfast 8–11 AM; Mapro garden fills by noon on weekends. Chinaman's Falls is monsoon-only and quieter than the viewpoints. Krishnabai temple sits on a cliff at the Krishna's source, 6–8 AM. Arthur's Seat wind gap is a 4–6:30 PM sunset drop. Venna Lake pedal boats 4–7 PM. Mist and drizzle are common; nature trails score lower in heavy rain — swap to Mapro, temples and indoor tasting.",
    sources: ["Satara hill-station notes", "Localink ghat spots"],
    cityIds: ["mahabaleshwar", "panchgani"],
    tags: ["mahabaleshwar", "strawberry", "venna", "arthur", "monsoon", "hill", "wilson"],
  },
  {
    id: "k-caves",
    title: "Ajanta, Ellora, Elephanta and rock-cut Maharashtra",
    body: "Ajanta: 30 painted Buddhist caves in a horseshoe gorge; go at opening. Ellora: Hindu, Buddhist and Jain caves including Kailasa (Cave 16). Elephanta is a Mumbai harbour ferry, not in the Localink inland heatmap by default. Pataleshwar in Pune is an 8th-century cave on JM Road. Pandavleni above Nashik has 24 Buddhist caves, climb early. Bhaja and Karla sit near Lonavala. Dharashiv caves are near Osmanabad. Lonar is a meteorite crater lake in Buldhana district, ringed by temples — not a cave, but a day trip from Ajanta country.",
    sources: ["ASI cave circuit notes"],
    cityIds: ["chhatrapati-sambhajinagar", "ajanta", "pune", "nashik", "lonar"],
    tags: ["ajanta", "ellora", "cave", "buddhist", "kailasa", "unesco", "rock"],
  },
  {
    id: "k-food-when",
    title: "Best times to eat across cities",
    body: "Breakfast misal and poha: Pune and Nashik 8–11 AM. Kolhapur rassa: lunch 12–3 PM. Mumbai kebabs and baida roti: 9 PM–2 AM. Nagpur tarri-style night snacks: 8–11:30 PM. Sambhajinagar Gulmandi naan qalia: 8–11 PM. Ratnagiri seafood thali: 12–3 PM at the jetty. Mahabaleshwar strawberries: 8–11 AM at the farm, crush all day at Mapro. Vineyard tastings: Nashik 4–7 PM. Cutting chai: Sassoon Dock from 4 AM. Always ask how spicy; Kolhapur and Pune misal run hotter than tourist menus.",
    sources: ["Localink vendor network", "Spot peak windows"],
    cityIds: [],
    tags: ["food", "eat", "breakfast", "lunch", "dinner", "misal", "seafood", "when", "time"],
  },
  {
    id: "k-crowds-traffic",
    title: "Crowds and traffic",
    body: "Localink treats crowd as a 0–100 popularity score. Packed is 70%+. Peak road traffic in cities is roughly 9 AM–12 PM and 5–9 PM; the itinerary engine pads travel by about 70% in those hours. Dawn and late night are the calmest roads. Hidden gems are flagged when a spot is easy to miss and usually quieter. Raise crowd tolerance on the itinerary page if you do not mind busy lanes; lower it to prefer Khotachiwadi-style corners over Mohammed Ali Road at night.",
    sources: ["Localink heatmap model", "Itinerary traffic factors"],
    cityIds: [],
    tags: ["crowd", "traffic", "busy", "quiet", "peak", "heatmap", "packed"],
  },
  {
    id: "k-festivals",
    title: "Festivals and seasonal notes",
    body: "Ganeshotsav (typically August–September) fills Pune and Mumbai; Dagadusheth and Girgaon become very crowded. Wari to Pandharpur (Ashadhi, usually June–July) packs the warkari roads. Diwali lights old-city markets. Alphonso season on the Konkan is late March–May. Flamingos at Sewri are a winter (roughly December–May) tide story. Monsoon (June–September) is best for Amboli, Mahabaleshwar falls and ghat greenery, worst for exposed ridges in heavy rain. Nagpur summers are extremely hot — start at dawn.",
    sources: ["Maharashtra festival calendar", "Localink seasonal notes"],
    cityIds: [],
    tags: ["festival", "ganesh", "wari", "monsoon", "alphonso", "flamingo", "season", "diwali"],
  },
  {
    id: "k-spiritual",
    title: "Major shrines",
    body: "Shirdi Sai samadhi town wakes around 4 AM. Trimbakeshwar and Bhimashankar are jyotirlingas. Mahalaxmi Kolhapur kakad aarti is 5–7 AM. Tuljapur's Tulja Bhavani is a Maratha kuldaivat hill shrine. Pandharpur is where warkari roads end at Vitthal. Nanded's Hazur Sahib sits on the Godavari. Ganpatipule's Ganesh is on the beach. Hingoli's Aundha Nagnath is another jyotirlinga in cotton country. Dress modestly, expect queues on weekends, and use dawn or late evening when Localink peak windows say so.",
    sources: ["Temple notices", "Localink spiritual spots"],
    cityIds: ["shirdi", "kolhapur", "trimbakeshwar", "pandharpur", "nanded", "ganpatipule"],
    tags: ["temple", "jyotirlinga", "sai", "shirdi", "vitthal", "spiritual", "aarti", "darshan"],
  },
  {
    id: "k-forts",
    title: "Forts",
    body: "Raigad, Shivaji's capital, is reached by ropeway or about 1,450 steps from Mahad. Sinhagad is Pune's classic sunrise fort. Panhala is the hill fort of the great escape. Sindhudurg is an island-sea fort off Malvan. Murud-Janjira was never conquered. Vasai has Portuguese ruins. Satara's Ajinkyatara overlooks the town. Shivneri at Junnar is Shivaji's birthplace. Carry water; start early; monsoon stone is slippery.",
    sources: ["Maratha fort notes", "Localink heritage spots"],
    cityIds: ["raigad-fort", "pune", "panhala", "sindhudurg-malvan"],
    tags: ["fort", "shivaji", "raigad", "sinhagad", "janjira", "maratha"],
  },
  {
    id: "k-language",
    title: "Language",
    body: "Marathi is the state language. Hindi and English are widely understood in cities. Sarathi can take questions in Marathi, Hindi or English. Useful words: namaskar (hello), dhanyawad (thank you), kiti (how much), paha (see), jevna (eat), paus (rain). Konkani appears on the coast. Speak slowly at temple counters; numbers for prices are often shown on boards.",
    sources: ["Localink language card"],
    cityIds: [],
    tags: ["marathi", "hindi", "language", "namaskar", "speak"],
  },
];

function spotDoc(s: {
  id: string;
  name: string;
  cityName: string;
  city: string;
  category: string;
  blurb: string;
  peak: string;
  walkMins: number;
  cost: number;
  hidden: boolean;
  rating: number;
  reviews: number;
  durationMins: number;
  crowd: number;
}): KnowledgeDoc {
  return {
    id: `spot-${s.id}`,
    title: s.name,
    body: `${s.name} is a ${s.category.toLowerCase()} stop in ${s.cityName}, Maharashtra. ${s.blurb} Best / peak window: ${s.peak}. Typical visit ${s.durationMins} minutes. About ${s.walkMins} minutes on foot from a local start point. Cost about ₹${s.cost} per person${s.cost === 0 ? " (free)" : ""}. Traveller rating ${s.rating} from ${s.reviews} reviews. Usual crowd score ${s.crowd}/100.${s.hidden ? " Localink flags this as a hidden gem." : ""} Ask Sarathi for nearby swaps at the same hour.`,
    sources: [`Localink spot record ${s.id}`, s.cityName],
    cityIds: [s.city],
    tags: [
      s.name.toLowerCase(),
      s.cityName.toLowerCase(),
      s.category.toLowerCase(),
      s.hidden ? "hidden" : "popular",
    ],
  };
}

export function ensureKnowledge() {
  const db = getDb();
  if (db.knowledge.length > 0) return db.knowledge;
  const docs = [...curated, ...db.spots.map(spotDoc)];
  setKnowledge(docs);
  return docs;
}
