import mumbaiImg from "@/assets/city-mumbai.jpg";
import puneImg from "@/assets/city-pune.jpg";
import aurangabadImg from "@/assets/city-aurangabad.jpg";
import mahabaleshwarImg from "@/assets/city-mahabaleshwar.jpg";
import nashikImg from "@/assets/city-nashik.jpg";
import kolhapurImg from "@/assets/city-kolhapur.jpg";
import nagpurImg from "@/assets/city-nagpur.jpg";
import ratnagiriImg from "@/assets/city-ratnagiri.jpg";
import coastImg from "@/assets/scene-coast.jpg";
import ghatsImg from "@/assets/scene-ghats.jpg";
import templeImg from "@/assets/scene-temple.jpg";
import townImg from "@/assets/scene-town.jpg";

export type Spot = {
  id: string;
  name: string;
  city: CityId;
  lat: number;
  lng: number;
  category: "Food" | "Heritage" | "Nature" | "Craft" | "Spiritual";
  crowd: number; // 0-100 live popularity
  peak: string;
  walkMins: number;
  cost: number; // ₹ per person
  hidden: boolean;
  blurb: string;
  rating: number; // 1-5 traveller rating
  reviews: number; // number of traveller reviews
  durationMins: number; // typical time spent on site
};

export type SpotSeed = Omit<Spot, "rating" | "reviews" | "durationMins">;

export type CityId = string;

export type City = {
  id: CityId;
  name: string;
  tagline: string;
  image?: string;
  lat: number;
  lng: number;
  weather: string;
  temp: number;
  /** Featured on the home page grid; the rest live in the "more places" dropdown. */
  featured?: boolean;
};


export const cities: City[] = [
  {
    id: "mumbai",
    name: "Mumbai",
    tagline: "Sea breeze, Irani chai and art deco evenings",
    image: mumbaiImg,
    lat: 18.9388,
    lng: 72.8354,
    weather: "Humid & clear",
    temp: 31,
    featured: true,
  },
  {
    id: "pune",
    name: "Pune",
    tagline: "Peshwa wadas, misal lanes and hill sunsets",
    image: puneImg,
    lat: 18.5196,
    lng: 73.8553,
    weather: "Pleasant breeze",
    temp: 27,
  featured: true,
  },
  {
    id: "chhatrapati-sambhajinagar",
    name: "Chhatrapati Sambhajinagar",
    tagline: "Ajanta–Ellora country and Paithani looms",
    image: aurangabadImg,
    lat: 19.8762,
    lng: 75.3433,
    weather: "Dry & warm",
    temp: 34,
  featured: true,
  },
  {
    id: "mahabaleshwar",
    name: "Mahabaleshwar",
    tagline: "Strawberry farms and Sahyadri mist",
    image: mahabaleshwarImg,
    lat: 17.9307,
    lng: 73.6477,
    weather: "Misty drizzle",
    temp: 21,
  featured: true,
  },
  {
    id: "nashik",
    name: "Nashik",
    tagline: "Godavari ghats, vineyards and Trimbak trails",
    image: nashikImg,
    lat: 19.9975,
    lng: 73.7898,
    weather: "Cool & clear",
    temp: 26,
  featured: true,
  },
  {
    id: "kolhapur",
    name: "Kolhapur",
    tagline: "Mahalaxmi bells, tambda-pandhra and chappal lanes",
    image: kolhapurImg,
    lat: 16.705,
    lng: 74.2433,
    weather: "Warm & bright",
    temp: 30,
  featured: true,
  },
  {
    id: "nagpur",
    name: "Nagpur",
    tagline: "Orange country, Deekshabhoomi and tiger gateways",
    image: nagpurImg,
    lat: 21.1458,
    lng: 79.0882,
    weather: "Dry & hot",
    temp: 36,
  featured: true,
  },
  {
    id: "ratnagiri",
    name: "Ratnagiri",
    tagline: "Konkan coves, alphonso orchards and sea forts",
    image: ratnagiriImg,
    lat: 16.9902,
    lng: 73.312,
    weather: "Breezy & humid",
    temp: 29,
  featured: true,
  },
];

/** Every other district HQ, taluka town and notable getaway across Maharashtra. */
const towns: [name: string, lat: number, lng: number, tagline: string][] = [
  ["Thane", 19.2183, 72.9781, "Lake city of thirty talavs and Kopineshwar bells"],
  ["Navi Mumbai", 19.033, 73.0297, "Planned promenades, flamingo creeks and Belapur forts"],
  ["Kalyan", 19.2437, 73.1355, "Old port town on the Ulhas with Durgadi ramparts"],
  ["Vasai-Virar", 19.3919, 72.8397, "Portuguese fort ruins wrapped in banana groves"],
  ["Panvel", 18.9894, 73.1175, "Gateway to Matheran and the Karnala bird sanctuary"],
  ["Alibaug", 18.6414, 72.8722, "Kolaba sea fort, black-sand coves and weekend ferries"],
  ["Murud-Janjira", 18.3, 72.9646, "The island fort nobody ever conquered"],
  ["Matheran", 18.9866, 73.2707, "Car-free red-earth hill station with toy-train mornings"],
  ["Karjat", 18.9107, 73.3233, "Monsoon waterfalls, vada pav and Kondana caves"],
  ["Lonavala", 18.7546, 73.4062, "Chikki lanes, Tiger Point mist and Bhaja rock-cuts"],
  ["Khandala", 18.7599, 73.3739, "Ghat-edge viewpoints above the Mumbai–Pune expressway"],
  ["Pimpri-Chinchwad", 18.6298, 73.7997, "Industrial belt with Morya Gosavi temple mornings"],
  ["Talegaon Dabhade", 18.7351, 73.6754, "Flower farms and Peshwa-era wada lanes"],
  ["Baramati", 18.1514, 74.5772, "Sugarcane country with a serious jalebi habit"],
  ["Junnar", 19.2077, 73.8752, "Shivneri fort birthplace and Lenyadri cave shrines"],
  ["Bhimashankar", 19.0725, 73.5361, "Jyotirlinga in a shola forest of giant squirrels"],
  ["Satara", 17.6805, 74.0183, "Ajinkyatara ramparts and kandi pedha counters"],
  ["Wai", 17.9509, 73.8899, "Ghats of the Krishna, film-set temples, quiet steps"],
  ["Panchgani", 17.9247, 73.8006, "Table Land plateau and strawberry-cream evenings"],
  ["Sangli", 16.8524, 74.5815, "Turmeric mandis and Ganpati Panchayatan temple"],
  ["Miraj", 16.8281, 74.6417, "Sitar and tanpura workshops two centuries old"],
  ["Solapur", 17.6599, 75.9064, "Chaddar looms, Siddheshwar lake and shenga chutney"],
  ["Pandharpur", 17.6799, 75.3306, "Vitthal's town, where the warkari roads all end"],
  ["Tuljapur", 18.0086, 76.0723, "Tulja Bhavani hill shrine of the Marathas"],
  ["Akkalkot", 17.5222, 76.2064, "Swami Samarth's swayambhu math and dharamshalas"],
  ["Osmanabad (Dharashiv)", 18.186, 76.0419, "Dharashiv rock caves and dry Balaghat plateau"],
  ["Latur", 18.4088, 76.5604, "Basalt plateau town of sugar, seeds and study halls"],
  ["Nanded", 19.1383, 77.321, "Hazur Sahib gurdwara gold on the Godavari"],
  ["Parbhani", 19.2608, 76.7748, "Agri-university town with Pathri's Sai roots nearby"],
  ["Hingoli", 19.7147, 77.1439, "Aundha Nagnath jyotirlinga in cotton country"],
  ["Jalna", 19.8347, 75.8816, "Seed capital with Motibagh and steel-rolling lanes"],
  ["Beed", 18.9891, 75.7601, "Kankaleshwar's water temple and Balaghat ridges"],
  ["Ambajogai", 18.7318, 76.3853, "Yogeshwari shrine and 12th-century rock carvings"],
  ["Shirdi", 19.7645, 74.4762, "Sai Baba's samadhi town, awake at four in the morning"],
  ["Ahilyanagar (Ahmednagar)", 19.0948, 74.7480, "Nizam Shahi fort and Chand Bibi's mahal"],
  ["Shani Shingnapur", 19.3813, 74.7429, "Village of doorless houses and the black stone Shani"],
  ["Bhandardara", 19.5333, 73.75, "Arthur Lake, Randha falls and Kalsubai's summit trail"],
  ["Igatpuri", 19.6957, 73.5628, "Vipassana silence, ghats and monsoon-green Kasara"],
  ["Trimbakeshwar", 19.9333, 73.5333, "Godavari's source and a jyotirlinga under Brahmagiri"],
  ["Malegaon", 20.5537, 74.5288, "Powerloom city with its own film industry"],
  ["Dhule", 20.9042, 74.7749, "Khandesh crossroads on the Panzara river"],
  ["Nandurbar", 21.3667, 74.2333, "Satpura tribal belt, chillies and Toranmal plateau"],
  ["Toranmal", 21.8833, 74.4667, "Khandesh's forgotten hill station of seven lakes"],
  ["Jalgaon", 21.0077, 75.5626, "Banana capital and gateway to Ajanta"],
  ["Bhusawal", 21.0435, 75.7851, "Railway junction town on the Tapi"],
  ["Ajanta", 20.5522, 75.7033, "Thirty painted Buddhist caves in a horseshoe gorge"],
  ["Buldhana", 20.5292, 76.1806, "Lonar's meteorite crater lake sits just downhill"],
  ["Lonar", 19.9765, 76.5209, "Fifty-thousand-year-old crater lake ringed by temples"],
  ["Akola", 20.7096, 77.0026, "Cotton mandis and the Narnala fort escarpment"],
  ["Washim", 20.1113, 77.1333, "Balaji temple town of the Bhonsle era"],
  ["Amravati", 20.9374, 77.7796, "Ambadevi shrine and the road up to Chikhaldara"],
  ["Chikhaldara", 21.4, 77.3167, "Melghat's coffee-growing hill station"],
  ["Yavatmal", 20.3888, 78.1204, "Cotton city on the Wardha plateau"],
  ["Wardha", 20.7453, 78.6022, "Sevagram ashram, khadi looms and Gandhi's clay huts"],
  ["Chandrapur", 19.9615, 79.2961, "Tadoba's tiger gateway inside a walled Gond city"],
  ["Gadchiroli", 20.1809, 80.0035, "Deep forest district of the Wainganga's bamboo belt"],
  ["Gondia", 21.4602, 80.1921, "Rice bowl of lakes and Navegaon–Nagzira parks"],
  ["Bhandara", 21.1667, 79.65, "Brass-utensil town of a thousand tanks"],
  ["Ramtek", 21.3956, 79.3269, "Kalidasa's hill of temples above Khindsi lake"],
  ["Sindhudurg (Malvan)", 16.0667, 73.4667, "Sindhudurg sea fort and Tarkarli's clear water"],
  ["Ganpatipule", 17.1447, 73.2686, "Swayambhu Ganesh right on the beach"],
  ["Chiplun", 17.5316, 73.5093, "Vashishti river town below the Parshuram ghat"],
  ["Dapoli", 17.7594, 73.1856, "Konkan's mini-Mahabaleshwar with Murud beach"],
  ["Guhagar", 17.4833, 73.2, "One long clean beach and Vyadeshwar's temple"],
  ["Harihareshwar", 17.9967, 73.0167, "Kashi of the south, circumambulated over rock"],
  ["Diveagar", 18.1667, 72.9833, "Suru groves, dolphins and quiet weekday sand"],
  ["Kudal", 16.0104, 73.6889, "Kokum, mango and the road to Amboli"],
  ["Amboli", 15.9552, 74.0022, "Rainiest ghat in Maharashtra, waterfall after waterfall"],
  ["Sawantwadi", 15.9046, 73.8221, "Ganjifa cards and lacquered wooden toys"],
  ["Ichalkaranji", 16.6886, 74.4606, "Powerloom town of the Panchganga"],
  ["Panhala", 16.8122, 74.1106, "Hill fort of Shivaji's great escape"],
  ["Karad", 17.2896, 74.1817, "Preeti Sangam, where Krishna meets Koyna"],
  ["Koyna Nagar", 17.4, 73.75, "Dam, backwaters and the Sahyadri tiger reserve"],
  ["Mahad", 18.0833, 73.4167, "Raigad fort's base town and Chavdar tale"],
  ["Raigad Fort", 18.2338, 73.4405, "Shivaji's capital, reached by ropeway or 1,450 steps"],
  ["Pen", 18.7378, 73.0958, "Ganesh idol workshops running all year"],
  ["Uran", 18.8776, 72.9377, "Karanja creek, salt pans and dock horizons"],
  ["Shrivardhan", 18.0333, 73.0167, "Peshwa ancestral town with a betel-nut coastline"],
];

const townWeather = ["Clear skies", "Warm & dry", "Breezy", "Light clouds", "Cool morning"];

/** Pick a representative photo for towns that don't have a dedicated shot yet. */
function townImage(name: string, tagline: string) {
  const t = `${name} ${tagline}`.toLowerCase();
  if (/beach|sea|coast|konkan|creek|ferry|sand|dock|island|port|dolphin/.test(t)) return coastImg;
  if (/hill|ghat|plateau|fort|waterfall|lake|forest|valley|summit|crater|tiger/.test(t)) return ghatsImg;
  if (/temple|jyotirlinga|shrine|gurdwara|sai|math|ganesh|vitthal|warkari|devi|bhavani/.test(t))
    return templeImg;
  return townImg;
}

towns.forEach(([name, lat, lng, tagline], i) => {
  cities.push({
    id: name
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    name,
    tagline,
    image: townImage(name, tagline),
    lat,
    lng,
    weather: townWeather[i % townWeather.length]!,
    temp: 24 + ((i * 7) % 12),
  });
});

const seedSpots: SpotSeed[] = [

  // Mumbai
  {
    id: "m1",
    name: "Kala Ghoda Art Lanes",
    city: "mumbai",
    lat: 18.9295,
    lng: 72.8324,
    category: "Heritage",
    crowd: 74,
    peak: "6–9 PM",
    walkMins: 12,
    cost: 0,
    hidden: false,
    blurb: "Stone facades, street murals and a chai stall older than the galleries.",
  },
  {
    id: "m2",
    name: "Khotachiwadi Heritage Village",
    city: "mumbai",
    lat: 18.9585,
    lng: 72.8213,
    category: "Heritage",
    crowd: 22,
    peak: "8–10 AM",
    walkMins: 20,
    cost: 0,
    hidden: true,
    blurb: "A 200-year-old East Indian hamlet of wooden balconies hiding behind Girgaon.",
  },
  {
    id: "m3",
    name: "Bhendi Bazaar Midnight Kebabs",
    city: "mumbai",
    lat: 18.9585,
    lng: 72.8321,
    category: "Food",
    crowd: 88,
    peak: "9 PM–1 AM",
    walkMins: 8,
    cost: 250,
    hidden: false,
    blurb: "Seekh, baida roti and malpua — go hungry, go late.",
  },
  {
    id: "m4",
    name: "Sewri Flamingo Mudflats",
    city: "mumbai",
    lat: 18.9976,
    lng: 72.8664,
    category: "Nature",
    crowd: 31,
    peak: "7–9 AM",
    walkMins: 25,
    cost: 100,
    hidden: true,
    blurb: "Winter flamingos against the docks — tide timing is everything.",
  },
  // Pune
  {
    id: "p1",
    name: "Tulshibaug Bangle Bylanes",
    city: "pune",
    lat: 18.5158,
    lng: 73.8567,
    category: "Craft",
    crowd: 81,
    peak: "5–8 PM",
    walkMins: 15,
    cost: 150,
    hidden: false,
    blurb: "Lac bangles, kolhapuri chappals and the loudest bargaining in the city.",
  },
  {
    id: "p2",
    name: "Pataleshwar Rock Cave",
    city: "pune",
    lat: 18.5223,
    lng: 73.8494,
    category: "Spiritual",
    crowd: 28,
    peak: "7–9 AM",
    walkMins: 10,
    cost: 0,
    hidden: true,
    blurb: "An 8th-century basalt cave temple carved in a single rock, right off JM Road.",
  },
  {
    id: "p3",
    name: "Bhandarkar Misal Trail",
    city: "pune",
    lat: 18.5286,
    lng: 73.8329,
    category: "Food",
    crowd: 66,
    peak: "8–11 AM",
    walkMins: 18,
    cost: 120,
    hidden: false,
    blurb: "Three counters, three heat levels, one very honest glass of buttermilk.",
  },
  {
    id: "p4",
    name: "Vetal Tekdi Sunrise Ridge",
    city: "pune",
    lat: 18.5169,
    lng: 73.8154,
    category: "Nature",
    crowd: 35,
    peak: "5:45–7 AM",
    walkMins: 40,
    cost: 0,
    hidden: true,
    blurb: "City's green lung — walkable ridge line with peacocks at first light.",
  },
  // Chhatrapati Sambhajinagar
  {
    id: "a1",
    name: "Ellora Cave 16 Kailasa",
    city: "chhatrapati-sambhajinagar",
    lat: 20.0268,
    lng: 75.1795,
    category: "Heritage",
    crowd: 79,
    peak: "10 AM–2 PM",
    walkMins: 45,
    cost: 40,
    hidden: false,
    blurb: "One rock, carved top-down into a temple. Arrive at opening for empty frames.",
  },
  {
    id: "a2",
    name: "Paithani Weavers' Courtyard",
    city: "chhatrapati-sambhajinagar",
    lat: 19.8834,
    lng: 75.3204,
    category: "Craft",
    crowd: 18,
    peak: "11 AM–4 PM",
    walkMins: 12,
    cost: 0,
    hidden: true,
    blurb: "Watch a single saree take nine months on a pit loom, thread by gold thread.",
  },
  {
    id: "a3",
    name: "Bibi Ka Maqbara Dusk Walk",
    city: "chhatrapati-sambhajinagar",
    lat: 19.9017,
    lng: 75.3203,
    category: "Heritage",
    crowd: 58,
    peak: "5–7 PM",
    walkMins: 22,
    cost: 25,
    hidden: false,
    blurb: "The Deccan's Taj, best in the last twenty minutes of gold light.",
  },
  // Mahabaleshwar
  {
    id: "h1",
    name: "Strawberry Farm Breakfast",
    city: "mahabaleshwar",
    lat: 17.9226,
    lng: 73.658,
    category: "Food",
    crowd: 62,
    peak: "8–11 AM",
    walkMins: 10,
    cost: 200,
    hidden: false,
    blurb: "Pick your own, then cream-and-crush on a plastic stool in the field.",
  },
  {
    id: "h2",
    name: "Chinaman's Falls Trail",
    city: "mahabaleshwar",
    lat: 17.9105,
    lng: 73.6791,
    category: "Nature",
    crowd: 26,
    peak: "7–10 AM",
    walkMins: 35,
    cost: 0,
    hidden: true,
    blurb: "Monsoon-only cascade down a forest path most tour buses skip.",
  },
  {
    id: "h3",
    name: "Krishnabai Temple Ledge",
    city: "mahabaleshwar",
    lat: 17.9218,
    lng: 73.6444,
    category: "Spiritual",
    crowd: 20,
    peak: "6–8 AM",
    walkMins: 28,
    cost: 0,
    hidden: true,
    blurb: "13th-century temple on a cliff where the Krishna river begins.",
  },
  // Nashik
  {
    id: "n1",
    name: "Ramkund Ghat Aarti",
    city: "nashik",
    lat: 19.9995,
    lng: 73.7899,
    category: "Spiritual",
    crowd: 68,
    peak: "6–8 PM",
    walkMins: 12,
    cost: 0,
    hidden: false,
    blurb: "Godavari steps at dusk — lamps, flower boats and a very old evening rhythm.",
  },
  {
    id: "n2",
    name: "Sula Vineyard Sunset Tasting",
    city: "nashik",
    lat: 20.0333,
    lng: 73.6667,
    category: "Food",
    crowd: 72,
    peak: "4–7 PM",
    walkMins: 20,
    cost: 900,
    hidden: false,
    blurb: "India's wine country, best when the Gangapur backwaters turn copper.",
  },
  {
    id: "n3",
    name: "Pandavleni Rock Caves",
    city: "nashik",
    lat: 19.9403,
    lng: 73.7455,
    category: "Heritage",
    crowd: 24,
    peak: "7–10 AM",
    walkMins: 35,
    cost: 25,
    hidden: true,
    blurb: "24 Buddhist caves cut into a hill above the highway — climb before the sun does.",
  },
  // Kolhapur
  {
    id: "k1",
    name: "Mahalaxmi Temple Kakad Aarti",
    city: "kolhapur",
    lat: 16.6949,
    lng: 74.2318,
    category: "Spiritual",
    crowd: 76,
    peak: "5–7 AM",
    walkMins: 10,
    cost: 0,
    hidden: false,
    blurb: "The first aarti of the day, before the queue lines even form.",
  },
  {
    id: "k2",
    name: "Chappal Karagir Workshops",
    city: "kolhapur",
    lat: 16.6981,
    lng: 74.2405,
    category: "Craft",
    crowd: 21,
    peak: "11 AM–5 PM",
    walkMins: 14,
    cost: 0,
    hidden: true,
    blurb: "Hand-stitched kolhapuris, made in front of you by third-generation karagirs.",
  },
  {
    id: "k3",
    name: "Tambda–Pandhra Rassa Row",
    city: "kolhapur",
    lat: 16.7009,
    lng: 74.2415,
    category: "Food",
    crowd: 83,
    peak: "12–3 PM",
    walkMins: 8,
    cost: 220,
    hidden: false,
    blurb: "Two mutton broths, one plate, zero mercy on the spice front.",
  },
  // Nagpur
  {
    id: "g1",
    name: "Deekshabhoomi Stupa",
    city: "nagpur",
    lat: 21.1281,
    lng: 79.0644,
    category: "Heritage",
    crowd: 47,
    peak: "5–7 PM",
    walkMins: 15,
    cost: 0,
    hidden: false,
    blurb: "India's largest hollow stupa — quiet marble and a very loud history.",
  },
  {
    id: "g2",
    name: "Itwari Orange Wholesale Market",
    city: "nagpur",
    lat: 21.1573,
    lng: 79.1121,
    category: "Food",
    crowd: 64,
    peak: "6–9 AM",
    walkMins: 18,
    cost: 80,
    hidden: true,
    blurb: "Crates of santra at dawn, plus the city's best kadak chai in a cutting glass.",
  },
  {
    id: "g3",
    name: "Ambazari Lake Walkway",
    city: "nagpur",
    lat: 21.1263,
    lng: 79.0245,
    category: "Nature",
    crowd: 33,
    peak: "6–8 AM",
    walkMins: 30,
    cost: 0,
    hidden: false,
    blurb: "Shaded loop around the old British-era lake, best before the heat lands.",
  },
  // Ratnagiri
  {
    id: "r1",
    name: "Thibaw Palace Sea View",
    city: "ratnagiri",
    lat: 16.9944,
    lng: 73.3103,
    category: "Heritage",
    crowd: 29,
    peak: "4–6 PM",
    walkMins: 12,
    cost: 20,
    hidden: false,
    blurb: "Burma's exiled king watched this coastline for 25 years. It still delivers.",
  },
  {
    id: "r2",
    name: "Aare Ware Twin Beaches",
    city: "ratnagiri",
    lat: 17.0333,
    lng: 73.2667,
    category: "Nature",
    crowd: 25,
    peak: "5–7 PM",
    walkMins: 20,
    cost: 0,
    hidden: true,
    blurb: "Two crescent bays split by a cliff road — stop where the bus doesn't.",
  },
  {
    id: "r3",
    name: "Alphonso Orchard Breakfast",
    city: "ratnagiri",
    lat: 16.9631,
    lng: 73.3402,
    category: "Food",
    crowd: 38,
    peak: "7–10 AM",
    walkMins: 15,
    cost: 300,
    hidden: false,
    blurb: "Hapus straight off the tree in season, amba poli the rest of the year.",
  },
];


/** Generated highlights for every town that has no hand-written spots yet. */
const categories = ["Food", "Heritage", "Nature", "Craft", "Spiritual"] as const;

const templates: [suffix: string, blurb: string][] = [
  ["Old Market Lanes", "Morning mandi rows where the town actually shops, bargains and eats."],
  ["Heritage Quarter Walk", "Wadas, stepwells and shrines within one slow walkable loop."],
  ["Riverside / Lake Point", "Local evening spot for water, birds and very good roasted corn."],
  ["Local Thali Counter", "Family-run kitchen serving the district's own version of a thali."],
  ["Hilltop Sunset View", "Short climb above the town for the whole valley at golden hour."],
];

const seededTowns = new Set(seedSpots.map((s) => s.city));

const generated: SpotSeed[] = [];
cities.forEach((city, ci) => {
  if (seededTowns.has(city.id)) return;
  templates.forEach(([suffix, blurb], ti) => {
    const n = ci * 5 + ti;
    generated.push({
      id: `${city.id}-${ti + 1}`,
      name: `${city.name} ${suffix}`,
      city: city.id,
      lat: city.lat + ((n % 7) - 3) * 0.004,
      lng: city.lng + ((n % 5) - 2) * 0.004,
      category: categories[(ti + ci) % categories.length]!,
      crowd: 15 + ((n * 13) % 70),
      peak: ["6–9 AM", "11 AM–2 PM", "4–7 PM", "6–9 PM"][n % 4]!,
      walkMins: 8 + ((n * 3) % 30),
      cost: [0, 0, 50, 120, 200, 350][n % 6]!,
      hidden: n % 3 === 0,
      blurb,
    });
  });
});

export const spots: Spot[] = [...seedSpots, ...generated].map((s, i) => ({
  ...s,
  rating: Number((3.5 + (((i * 7) % 15) / 10)).toFixed(1)),
  reviews: 40 + ((i * 137) % 1800),
  durationMins: 30 + ((i * 15) % 120),
}));
