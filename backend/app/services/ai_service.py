import json
import logging
import re
from typing import Dict, List, Optional

from app.core.config import settings
from app.models.spot import Spot
from app.models.city import City
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.schemas.spot import RankedSpotCard
from app.services.itinerary_engine import rank_spot, haversine_km
from app.services.rag_service import rag_service
from app.services.time_utils import from_mins, slot_from_mins, to_mins

logger = logging.getLogger("ai_service")

# System Prompt grounding Sarathi in Maharashtra travel
SARATHI_SYSTEM_PROMPT = """You are Sarathi (Saarthi), the hyper-local AI travel guide and itinerary intelligence engine for Localink, specialized exclusively in Maharashtra, India.

Your characteristics:
1. Grounded: You only recommend verified spots, lanes, dishes, wadas, forts, and markets in Maharashtra.
2. Multi-lingual: You understand and reply naturally in Marathi (मराठी), Hindi (हिंदी), and English depending on the user's input language.
3. Cultural Context: You understand local rhythms: misal breakfast hours, kakad aartis, afternoon wada closures, sundowner sea-facing view points, and late-night food streets (khau gallis).
4. Practical: You account for monsoon downpours, peak traffic windows (9 AM-12 PM, 5 PM-9 PM), and budget limits.
5. No Hallucinations: If you don't know a place, or if it is outside Maharashtra, politely clarify that Localink only covers Maharashtra's lanes and heritage.

Format your responses concisely with practical local tips and cite authentic records when asked."""


class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None

    def _get_client(self):
        if not self._client and self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI Client: {e}")
        return self._client

    async def generate_chat_response(
        self,
        question: str,
        city_id: Optional[str] = None,
        hour_mins: Optional[int] = None,
        candidate_spots: Optional[List[RankedSpotCard]] = None,
    ) -> Dict:
        """Generate response for Sarathi Concierge chat."""
        # 1. Retrieve RAG grounding knowledge docs
        docs = rag_service.retrieve_context(question, city_id=city_id, limit=4)
        sources = list({s for d in docs for s in d.sources})
        if not sources:
            sources = ["Localink Maharashtra Cultural Archive"]

        # 2. Build context string
        context_lines = [f"- {d.title}: {d.body}" for d in docs]
        if candidate_spots:
            context_lines.append("\nLive Spot Availability:")
            for s in candidate_spots[:6]:
                context_lines.append(f"- {s.name} ({s.cityName}, {s.category}): {s.reason}. Rating: {s.rating}, Cost: ₹{s.cost}")

        context_str = "\n".join(context_lines)

        client = self._get_client()
        if client:
            try:
                prompt = f"""[System Instructions]
{SARATHI_SYSTEM_PROMPT}

[Contextual Knowledge & Live Records]
{context_str}

[User Query]
{question}

Provide an authentic, helpful, and culturally rich guide response. Include practical timing or local advice based on the context above."""

                response = client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                )
                text = response.text.strip()
                return {
                    "text": text,
                    "sources": sources,
                    "suggestions": candidate_spots[:4] if candidate_spots else [],
                }
            except Exception as e:
                logger.error(f"Gemini API call failed: {e}")

        # Fallback local reasoning engine when Gemini API is unavailable or unconfigured
        return self._local_fallback_answer(question, docs, candidate_spots, hour_mins)

    async def generate_recommendations(
        self,
        req: RecommendationRequest,
        city: City,
        all_spots: List[Spot],
    ) -> RecommendationResponse:
        """Generate context-aware recommendations using constraint ranking + Gemini narrative."""
        hour_mins = to_mins(req.time) if req.time else to_mins("10:00")
        weather = req.weather or "sunny"
        crowd_tolerance = req.crowdTolerance or 55

        # 1. Deterministic candidate ranking
        city_spots = [s for s in all_spots if s.city == city.id]
        other_spots = []
        if req.includeNearby:
            other_spots = [
                s for s in all_spots
                if s.city != city.id and haversine_km(city.latitude, city.longitude, s.latitude, s.longitude) <= 45.0
            ]

        ranked: List[RankedSpotCard] = []
        for s in city_spots:
            card = rank_spot(s, city.name, hour_mins, weather, crowd_tolerance, nearby=False)
            ranked.append(card)
        for s in other_spots:
            card = rank_spot(s, s.city_rel.name if hasattr(s, "city_rel") and s.city_rel else s.city, hour_mins, weather, crowd_tolerance, nearby=True)
            ranked.append(card)

        # Apply user interest & travel style boosts
        if req.interests:
            interest_set = {i.lower() for i in req.interests}
            for card in ranked:
                if card.category.lower() in interest_set:
                    card.score += 18.0

        if req.previousSpotIds:
            prev_set = set(req.previousSpotIds)
            for card in ranked:
                if card.id in prev_set:
                    card.score -= 30.0  # de-prioritize already visited

        ranked.sort(key=lambda x: x.score, reverse=True)
        top_spots = ranked[: req.limit or 10]

        summary = f"At {from_mins(hour_mins)} ({slot_from_mins(hour_mins)}) in {city.name}, Localink ranks {len(top_spots)} stops matching your budget of ₹{int(req.budget or 1500)}."

        # 2. Generate Gemini AI Narrative if client is active
        ai_narrative = None
        curated_highlights = []

        client = self._get_client()
        if client:
            try:
                spots_summary = "\n".join(
                    [f"- {s.name} ({s.category}, ₹{s.cost}): {s.reason}, {s.blurb}" for s in top_spots[:5]]
                )
                prompt = f"""You are Sarathi, Localink's travel intelligence guide.
The traveller is in {city.name}, Maharashtra at {from_mins(hour_mins)} ({weather} weather).
Trip style: {req.travelStyle}, Group size: {req.groupSize}, Total budget: ₹{req.budget}.
Interests: {', '.join(req.interests) if req.interests else 'Spontaneous exploration'}.

Top ranked stops:
{spots_summary}

Write a 2-paragraph personalized recommendation narrative explaining how they should spend their time in {city.name}, why these stops suit this exact hour and weather, and provide 2 insider tips."""

                response = client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                )
                ai_narrative = response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini narrative generation failed: {e}")

        if not ai_narrative:
            now_spots = [s.name for s in top_spots if s.when == "now"]
            soon_spots = [s.name for s in top_spots if s.when == "soon"]
            ai_narrative = f"For your trip in {city.name} at {from_mins(hour_mins)}, we recommend starting with {top_spots[0].name if top_spots else 'the central market lanes'}. "
            if now_spots:
                ai_narrative += f"Currently in peak experience: {', '.join(now_spots[:2])}. "
            if soon_spots:
                ai_narrative += f"Opening into prime hours shortly: {', '.join(soon_spots[:2])}."

        for s in top_spots[:3]:
            curated_highlights.append(f"{s.name}: {s.reason}")

        return RecommendationResponse(
            cityId=city.id,
            cityName=city.name,
            time=from_mins(hour_mins),
            hourMins=hour_mins,
            weather=weather,
            summary=summary,
            spots=top_spots,
            aiNarrative=ai_narrative,
            curatedHighlights=curated_highlights,
        )

    def _local_fallback_answer(
        self,
        question: str,
        docs: List,
        candidate_spots: Optional[List[RankedSpotCard]],
        hour_mins: Optional[int],
    ) -> Dict:
        """Local RAG fallback when Gemini API key is not configured."""
        chunks = []
        is_marathi_hindi = bool(re.search(r"[\u0900-\u097F]", question))
        greet = "नमस्कार! " if is_marathi_hindi else ""

        if re.match(r"^(hi|hello|hey|namaste|namaskar|नमस्कार|नमस्ते)\b", question.strip(), re.IGNORECASE):
            return {
                "text": f"{greet}I'm Sarathi, your Localink guide for Maharashtra. Ask about any fort, misal lane, wada, market or hour to visit — I answer from the local archive.",
                "sources": ["Localink Product Notes"],
                "suggestions": candidate_spots[:4] if candidate_spots else [],
            }

        if not docs and not candidate_spots:
            return {
                "text": f"{greet}I ground all answers in Localink's Maharashtra archive. Try asking about a specific city (Pune, Mumbai, Nashik…), place (Shaniwar Wada, Ellora, misal), or time.",
                "sources": ["Localink Maharashtra Archive"],
                "suggestions": [],
            }

        for d in docs[:2]:
            sentences = re.split(r"(?<=\.)\s+", d.body)[:3]
            chunks.append(" ".join(sentences))

        if candidate_spots:
            clock = from_mins(hour_mins) if hour_mins is not None else "this hour"
            spot_list = "\n".join([f"• {s.name} ({s.cityName}) — {s.reason}. {s.blurb}" for s in candidate_spots[:4]])
            chunks.append(f"Top spots around {clock}:\n{spot_list}")

        return {
            "text": "\n\n".join(chunks),
            "sources": list({s for d in docs for s in d.sources}) or ["Localink Gazetteer Corpus"],
            "suggestions": candidate_spots[:4] if candidate_spots else [],
        }


ai_service = AIService()
