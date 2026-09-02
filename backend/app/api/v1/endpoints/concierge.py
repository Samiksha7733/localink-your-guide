import re
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.endpoints.auth import get_optional_current_user
from app.core.database import get_db
from app.models.city import City
from app.models.spot import Spot
from app.models.chat import ChatSession, ChatMessage
from app.models.user import User
from app.schemas.chat import SarathiAskRequest, SarathiAskResponse
from app.schemas.spot import RankedSpotCard
from app.services.ai_service import ai_service
from app.services.itinerary_engine import rank_spot
from app.services.time_utils import to_mins

router = APIRouter()


def detect_city_id(question: str, cities: list[City]) -> str | None:
    q = question.lower()
    for c in sorted(cities, key=lambda x: len(x.name), reverse=True):
        if c.name.lower() in q or c.id.replace("-", " ") in q:
            return c.id
    return None


def script_of(text: str) -> str:
    return "hi" if re.search(r"[\u0900-\u097F]", text) else "en"


@router.post("/ask", response_model=SarathiAskResponse)
async def ask_sarathi(
    req: SarathiAskRequest,
    current_user: User | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ask Sarathi (Hyper-Local AI Travel Guide) with RAG grounding."""
    # 1. Load cities & spots for spot candidate ranking
    city_stmt = select(City)
    cities = (await db.execute(city_stmt)).scalars().all()

    target_city_id = req.cityId or detect_city_id(req.question, cities) or "pune"
    target_city = next((c for c in cities if c.id == target_city_id), cities[0] if cities else None)

    hour_mins = to_mins(req.time) if req.time else to_mins("12:00")

    # Fetch spots for target city
    spot_stmt = select(Spot).where(Spot.city == target_city.id if target_city else "pune").options(selectinload(Spot.city_rel))
    spots = (await db.execute(spot_stmt)).scalars().all()

    # Generate candidate ranked spots
    candidate_cards: list[RankedSpotCard] = []
    if target_city:
        for s in spots:
            card = rank_spot(s, target_city.name, hour_mins, "sunny", 55, nearby=False)
            candidate_cards.append(card)
        candidate_cards.sort(key=lambda x: x.score, reverse=True)

    # 2. Query AI Service (with RAG & Gemini API)
    result = await ai_service.generate_chat_response(
        question=req.question,
        city_id=target_city_id,
        hour_mins=hour_mins,
        candidate_spots=candidate_cards,
    )

    lang = script_of(req.question)

    # 3. Save chat session if user is logged in
    session_id = req.sessionId
    if current_user:
        if not session_id:
            chat_session = ChatSession(user_id=current_user.id, city_id=target_city_id)
            db.add(chat_session)
            await db.flush()
            session_id = chat_session.id

        # Save user message
        user_msg = ChatMessage(
            session_id=session_id,
            role="user",
            text=req.question,
            sources=[],
            suggestions=[],
            language=lang,
        )
        db.add(user_msg)

        # Save assistant message
        guide_msg = ChatMessage(
            session_id=session_id,
            role="guide",
            text=result["text"],
            sources=result["sources"],
            suggestions=[s.model_dump() for s in result.get("suggestions", [])],
            language=lang,
        )
        db.add(guide_msg)
        await db.commit()

    return SarathiAskResponse(
        text=result["text"],
        sources=result["sources"],
        suggestions=result.get("suggestions", []),
        language=lang,
        sessionId=session_id,
    )
