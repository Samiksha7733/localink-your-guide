import re
from typing import Dict, List, Optional
from pydantic import BaseModel


class KnowledgeDoc(BaseModel):
    id: str
    title: str
    body: str
    sources: List[str]
    city_ids: List[str]
    tags: List[str]


# Verified Maharashtra Gazetteers, ASI notes, and local cultural corpus
CURATED_KNOWLEDGE: List[KnowledgeDoc] = [
    KnowledgeDoc(
        id="k-sarathi",
        title="Who is Sarathi (Saarthi)",
        body="Sarathi — also spelled Saarthi or Saarathi — is Localink's hyper-local travel concierge for Maharashtra. Sarathi answers in English, Hindi and Marathi using Localink's own archive: gazetteers, temple records, vendor interviews and the live spot database (peak hours, walk times, costs, crowd levels). Sarathi does not invent places outside Maharashtra. Ask about forts, food lanes, hidden spots, best hours, budgets, crowds or how to stitch a same-day route.",
        sources=["Localink product notes", "Sarathi concierge brief"],
        city_ids=[],
        tags=["sarathi", "saarthi", "saarathi", "chatbot", "localink", "guide", "who"],
    ),
    KnowledgeDoc(
        id="k-localink",
        title="What Localink does",
        body="Localink builds spontaneous micro-itineraries for Maharashtra. The itinerary engine uses your start and end time, group size, budget, weather and crowd tolerance. The map shows live-style popularity blobs and walkable eco-routes. The vendor portal lists pop-up stalls and workshops. Money is meant to stay with the person who actually runs the stall. Minimum workable budget on the itinerary page is ₹250 per person.",
        sources=["Localink itinerary engine", "Vendor portal copy"],
        city_ids=[],
        tags=["localink", "itinerary", "budget", "map", "vendor", "app"],
    ),
    KnowledgeDoc(
        id="k-shaniwar",
        title="Shaniwar Wada, Pune",
        body="Shaniwar Wada was built in 1732 by Bajirao I as the Peshwa seat in Pune. A seven-storey palace once stood inside; the 1828 fire left the massive base and fortifications. The Delhi Darwaza still shows elephant-proof spikes. Locals gather around 6:30 PM for the sound-and-light show. The quieter entrance is the Mastani Darwaza on the north side. Pair it with Tulshibaug lanes or Dagadusheth Halwai in the old city. Typical ticket for the light show is modest (~₹50). Best evening window: 6:30–8 PM; mornings are calmer for photographs of the walls.",
        sources=["Pune Gazetteer, 1885", "ASI site record PN-14", "Oral history: Kasba Peth guides"],
        city_ids=["pune"],
        tags=["shaniwar", "wada", "peshwa", "bajirao", "mastani", "pune", "heritage", "story", "history"],
    ),
    KnowledgeDoc(
        id="k-mumbai-night",
        title="Where locals eat in Mumbai after midnight",
        body="Bhendi Bazaar and Mohammed Ali Road stay awake until about 2 AM. Order baida roti at Suleman-style counters and malpua with rabdi a lane or two down. Nalli nihari appears late. For a calmer option, Sassoon Dock chai stalls open around 4–5 AM for fisherfolk and pour very strong cutting chai. Colaba and Bandra stay lively but the old-city meat lanes are the real after-midnight table. Peak crowd on Mohammed Ali Road is 10 PM–2 AM.",
        sources=["Localink vendor network", "BMC night-market permits 2026"],
        city_ids=["mumbai"],
        tags=["midnight", "night", "mumbai", "eat", "food", "kebab", "baida", "malpua", "mohammed", "bhendi", "late"],
    ),
    KnowledgeDoc(
        id="k-ellora-hidden",
        title="Hidden and quieter corners near Ellora",
        body="Most visitors queue only at Ellora Cave 16 (Kailasa), carved top-down from one rock. For a quieter hour, start with the Paithani weavers' courtyard in Chhatrapati Sambhajinagar (formerly Aurangabad) — a single saree can take nine months on a pit loom. Then go to Ellora Cave 29 (Dhumar Lena) around 4 PM, when western light hits the lingam chamber and tour buses have thinned. Ajanta is a separate gorge further north; go at opening (6–9 AM) for empty painted caves. Bibi Ka Maqbara is best in the last twenty minutes of gold light (5–7 PM).",
        sources=["Paithani Weavers' Co-op", "ASI Ellora conservation notes"],
        city_ids=["chhatrapati-sambhajinagar", "ajanta"],
        tags=["ellora", "hidden", "kailasa", "cave", "paithani", "ajanta", "aurangabad", "sambhajinagar", "dhumar"],
    ),
    KnowledgeDoc(
        id="k-pune",
        title="Pune in a day — by hour",
        body="Sunrise: Sinhagad fort ridge and pithla-bhakri; or Vetal Tekdi for peacocks. Breakfast: Bhandarkar / Deccan misal (8–11 AM) with buttermilk. Mid-morning: Pataleshwar rock cave off JM Road (8th-century basalt, still quiet). Afternoon: Osho Teerth garden in Koregaon Park. Evening: Shaniwar Wada sound-and-light ~6:30 PM, Dagadusheth aarti 7–9 PM, FC Road cafes 6–10 PM. Tulshibaug bangle bylanes peak 5–8 PM. Rainy days: prefer Pataleshwar, wadas and cafes over Sinhagad.",
        sources=["Localink Pune corpus", "Kasba Peth guides"],
        city_ids=["pune"],
        tags=["pune", "poona", "misal", "sinhagad", "pataleshwar", "dagadusheth", "fc", "itinerary"],
    ),
    KnowledgeDoc(
        id="k-konkan",
        title="Konkan and Ratnagiri",
        body="Ratnagiri is alphonso (hapus) country in season (typically late March–May). Thibaw Palace looks over the sea — Burma's exiled king watched this coast for 25 years; go 4–6 PM. Aare Ware are twin crescent beaches split by a cliff road. Ganpatipule has a swayambhu Ganesh on the sand; dawn aarti then a swim, not noon. Mandvi jetty is the lunch window for catch-of-the-day thalis (12–3 PM). Bhatye beach is quieter after dark. Further south: Sindhudurg/Malvan for Tarkarli water, Sawantwadi for ganjifa cards, Amboli for monsoon waterfalls.",
        sources=["Konkan gazetteer notes", "Localink coastal spots"],
        city_ids=["ratnagiri", "ganpatipule", "sindhudurg-malvan"],
        tags=["konkan", "ratnagiri", "alphonso", "hapus", "beach", "ganpatipule", "mango", "sea"],
    ),
    KnowledgeDoc(
        id="k-nashik",
        title="Nashik, vineyards and ghats",
        body="Ramkund ghat aarti on the Godavari is 6–8 PM. Panchavati (Sita Gufa, Kalaram) is calmer 6–9 AM. Sula and other Gangapur vineyards are a late-afternoon tasting (4–7 PM) when the backwaters turn copper (~₹900). Pandavleni Buddhist caves: climb 7–10 AM. Trimbakeshwar jyotirlinga at the Godavari source is better 6–8:30 PM than in the noon crush. Old-city wada breakfast (misal, poha) 7:30–10:30 AM before walking to Ramkund.",
        sources=["Nashik district notes", "Localink vineyard listings"],
        city_ids=["nashik", "trimbakeshwar"],
        tags=["nashik", "nasik", "sula", "wine", "godavari", "ramkund", "trimbak", "vineyard"],
    ),
    KnowledgeDoc(
        id="k-kolhapur",
        title="Kolhapur food and Mahalaxmi",
        body="Mahalaxmi kakad aarti is 5–7 AM, before queues form. Tambda–pandhra rassa (two mutton broths) is a lunch row, 12–3 PM, very spicy. Rankala lake loop is 5:30–8 PM. Chappal karagir workshops run 11 AM–5 PM — third-generation makers stitch in front of you. New Palace museum is a quiet 10 AM–1 PM indoor hour. Night bazaar around the temple 7–10 PM for silver and kolhapuris.",
        sources=["Kolhapur temple notices", "Karagir interviews"],
        city_ids=["kolhapur"],
        tags=["kolhapur", "mahalaxmi", "tambda", "rassa", "chappal", "rankala", "spicy"],
    ),
    KnowledgeDoc(
        id="k-nagpur",
        title="Nagpur oranges and evenings",
        body="Nagpur is hot by late morning. Itwari orange wholesale is 6–9 AM with kadak cutting chai. Ambazari lake walk 6–8 AM before heat. Deekshabhoomi, India's largest hollow stupa, is dignified at 5–7 PM. Futala lake promenade 6–9 PM with fountains. Zero Mile marker is a short heritage stop 9 AM–12 PM. Sitabuldi fort rampart 5–7 PM. Sadar khau galli 8–11:30 PM. Winter (Nov–Feb) is the santra season.",
        sources=["Nagpur municipal notes", "Localink Vidarbha corpus"],
        city_ids=["nagpur"],
        tags=["nagpur", "orange", "santra", "deekshabhoomi", "futala", "itwari", "heat"],
    ),
    KnowledgeDoc(
        id="k-mahabaleshwar",
        title="Mahabaleshwar hills",
        body="Wilson Point is the first sunrise (5:45–7:15 AM) — cold on the ridge. Strawberry farm breakfast 8–11 AM; Mapro garden fills by noon on weekends. Chinaman's Falls is monsoon-only and quieter than the viewpoints. Krishnabai temple sits on a cliff at the Krishna's source, 6–8 AM. Arthur's Seat wind gap is a 4–6:30 PM sunset drop. Venna Lake pedal boats 4–7 PM. Mist and drizzle are common; nature trails score lower in heavy rain — swap to Mapro, temples and indoor tasting.",
        sources=["Satara hill-station notes", "Localink ghat spots"],
        city_ids=["mahabaleshwar", "panchgani"],
        tags=["mahabaleshwar", "strawberry", "venna", "arthur", "monsoon", "hill", "wilson"],
    ),
]

STOP_WORDS = {
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our",
    "out", "has", "have", "this", "that", "with", "from", "they", "what", "when", "where", "which",
    "your", "about", "into", "than", "then", "some", "them", "been", "more", "also", "just", "over",
    "after", "before", "tell", "give", "please", "could", "would", "should", "there", "here",
    "something", "anything", "in", "on", "at", "to", "of", "a", "an", "is", "it", "me", "my", "we",
}

SYNONYMS: Dict[str, str] = {
    "bombay": "mumbai",
    "poona": "pune",
    "aurangabad": "sambhajinagar",
    "nasik": "nashik",
    "saarthi": "sarathi",
    "saarathi": "sarathi",
    "temple": "spiritual",
    "darshan": "spiritual",
    "breakfast": "morning",
    "dinner": "evening",
    "lunch": "afternoon",
    "midnight": "night",
    "late": "night",
    "kebab": "food",
    "misal": "food",
    "beach": "nature",
    "fort": "heritage",
    "cave": "heritage",
    "waterfall": "nature",
}


def tokenize(text: str) -> List[str]:
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    words = cleaned.split()
    return [SYNONYMS.get(w, w) for w in words if len(w) > 2 and w not in STOP_WORDS]


def score_doc(tokens: List[str], doc: KnowledgeDoc) -> int:
    hay = f"{doc.title} {doc.body} {' '.join(doc.tags)}".lower()
    score = 0
    for t in tokens:
        if any(t in tag or tag in t for tag in doc.tags):
            score += 6
        if t in doc.title.lower():
            score += 5
        hits = hay.count(t)
        if hits > 0:
            score += min(8, hits * 2)
    return score


class RAGService:
    @staticmethod
    def retrieve_context(query: str, city_id: Optional[str] = None, limit: int = 4) -> List[KnowledgeDoc]:
        tokens = tokenize(query)
        scored = [(doc, score_doc(tokens, doc)) for doc in CURATED_KNOWLEDGE]
        valid = [item for item in scored if item[1] > 0]
        valid.sort(key=lambda x: x[1], reverse=True)

        docs = [item[0] for item in valid[:limit]]
        if city_id:
            city_docs = [d for d in CURATED_KNOWLEDGE if city_id.lower() in [c.lower() for c in d.city_ids]]
            for cd in city_docs:
                if cd not in docs:
                    docs.insert(0, cd)
        return docs[:limit]


rag_service = RAGService()
