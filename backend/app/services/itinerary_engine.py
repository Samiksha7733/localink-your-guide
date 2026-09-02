import math
from typing import Dict, List, Optional, Tuple

from app.models.spot import Spot
from app.models.city import City
from app.models.guide import TouristGuide
from app.schemas.itinerary import (
    ItineraryGenerateRequest,
    ItineraryLegResponse,
    ItineraryResponse,
)
from app.schemas.spot import SpotResponse, RankedSpotCard
from app.schemas.guide import GuideResponse
from app.services.time_utils import (
    from_mins,
    mins_in_window,
    minutes_until_window,
    slot_from_mins,
    to_mins,
    traffic_factor,
    traffic_label,
)

MIN_BUDGET_PER_PERSON = 250.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def category_boost(slot: str, category: str) -> float:
    if slot == "dawn" and category in ["Nature", "Spiritual"]:
        return 22.0
    if slot == "morning" and category in ["Food", "Spiritual", "Nature"]:
        return 16.0
    if slot == "afternoon" and category in ["Heritage", "Craft"]:
        return 16.0
    if slot == "evening" and category in ["Nature", "Heritage", "Food"]:
        return 16.0
    if slot == "night" and category == "Food":
        return 28.0
    if slot == "night" and category != "Food":
        return -18.0
    return 0.0


def weather_adjust(weather: str, category: str) -> float:
    if weather == "rain" and category == "Nature":
        return -45.0
    if weather == "rain" and category in ["Heritage", "Craft", "Food"]:
        return 14.0
    if weather == "sunny" and category == "Nature":
        return 10.0
    if weather == "cloudy" and category == "Nature":
        return 4.0
    return 0.0


def calculate_live_crowd(spot: Spot, hour_mins: int) -> int:
    if mins_in_window(hour_mins, spot.peak_start_mins, spot.peak_end_mins):
        return spot.crowd
    until = minutes_until_window(hour_mins, spot.peak_start_mins, spot.peak_end_mins)
    if until <= 60:
        return max(5, int(spot.crowd * 0.75))
    return max(5, int(spot.crowd * 0.48))


def rank_spot(
    spot: Spot,
    city_name: str,
    hour_mins: int,
    weather: str,
    crowd_tolerance: int,
    nearby: bool = False,
    selected_category: Optional[str] = None,
) -> RankedSpotCard:
    in_peak = mins_in_window(hour_mins, spot.peak_start_mins, spot.peak_end_mins)
    until = minutes_until_window(hour_mins, spot.peak_start_mins, spot.peak_end_mins)
    when = "now" if in_peak else "soon" if until <= 90 else "later"
    crowd_now = calculate_live_crowd(spot, hour_mins)
    slot = slot_from_mins(hour_mins)

    score = 72.0
    if in_peak:
        score += 42.0
    elif until <= 45:
        score += 26.0
    elif until <= 90:
        score += 12.0
    else:
        score -= min(22.0, (until // 60) * 4.0)

    score += category_boost(slot, spot.category)
    score += weather_adjust(weather, spot.category)
    score -= max(0.0, float(crowd_now - crowd_tolerance)) * 1.15

    if spot.hidden and crowd_now < 45:
        score += 16.0

    score += (float(spot.rating) - 3.5) * 22.0
    score += min(12.0, float(spot.reviews) / 60.0)

    if nearby:
        score -= 8.0

    if selected_category and selected_category != "All" and spot.category != selected_category:
        score -= 50.0

    score -= traffic_factor(hour_mins) * 2.0

    # Format human-friendly reason
    reasons = []
    if when == "now":
        reasons.append(f"in its {spot.peak} peak right now")
    elif when == "soon":
        reasons.append(f"peaks {spot.peak} — about {until} min away")
    else:
        reasons.append(f"better later ({spot.peak})")
    reasons.append(spot.category.lower())
    if spot.hidden:
        reasons.append("hidden gem")
    if nearby:
        reasons.append(f"nearby in {city_name}")

    return RankedSpotCard(
        id=spot.id,
        name=spot.name,
        city=spot.city,
        cityName=city_name,
        category=spot.category,
        peak=spot.peak,
        crowd=spot.crowd,
        liveCrowd=crowd_now,
        walkMins=spot.walk_mins,
        cost=float(spot.cost),
        hidden=spot.hidden,
        blurb=spot.blurb,
        rating=float(spot.rating),
        reviews=spot.reviews,
        durationMins=spot.duration_mins,
        lat=spot.latitude,
        lng=spot.longitude,
        score=round(score, 1),
        reason=" · ".join(reasons),
        when=when,
        minutesUntilPeak=until,
        nearby=nearby,
    )


class ItineraryEngine:
    @staticmethod
    def generate_plan(
        req: ItineraryGenerateRequest,
        city: City,
        all_spots: List[Spot],
        guides: List[TouristGuide],
    ) -> ItineraryResponse:
        start_mins = to_mins(req.startTime)
        raw_end_mins = to_mins(req.endTime)
        end_mins = raw_end_mins if raw_end_mins > start_mins else start_mins + 60
        window_mins = end_mins - start_mins

        min_req_budget = MIN_BUDGET_PER_PERSON * req.groupSize
        effective_budget = max(req.budget, min_req_budget)

        # Tourist guide cost
        assigned_guide = guides[0] if guides else None
        guide_cost = 0.0
        if req.wantGuide and assigned_guide:
            guide_hours = math.ceil(window_mins / 60.0)
            guide_cost = float(assigned_guide.fee_per_hour) * guide_hours

        spendable_budget = max(0.0, effective_budget - guide_cost)

        # Separate city spots vs nearby spots
        city_spots = [s for s in all_spots if s.city == city.id]
        other_spots = [
            s for s in all_spots
            if s.city != city.id and haversine_km(city.latitude, city.longitude, s.latitude, s.longitude) <= 45.0
        ]

        # Rank all spots for the start time
        ranked_cards: List[RankedSpotCard] = []
        for s in city_spots:
            card = rank_spot(s, city.name, start_mins, req.weather, req.crowdTolerance, nearby=False)
            ranked_cards.append(card)
        for s in other_spots:
            card = rank_spot(s, s.city_rel.name if hasattr(s, "city_rel") and s.city_rel else s.city, start_mins, req.weather, req.crowdTolerance, nearby=True)
            ranked_cards.append(card)

        # Sort candidate spots by score
        ranked_cards.sort(key=lambda x: x.score + ((req.seed * 7 + len(x.id)) % 5), reverse=True)

        spot_map: Dict[str, Spot] = {s.id: s for s in all_spots}

        # Sequential Scheduling algorithm
        legs: List[ItineraryLegResponse] = []
        spent = 0.0
        cursor = start_mins

        for card in ranked_cards:
            if len(legs) >= 6:
                break
            spot = spot_map.get(card.id)
            if not spot:
                continue

            travel_base = 10 if len(legs) == 0 else max(8, int(spot.walk_mins * 0.8))
            travel_time = int(travel_base * traffic_factor(cursor))
            stay_time = max(30, spot.duration_mins)

            arrive = cursor + travel_time
            depart = arrive + stay_time
            leg_cost = float(spot.cost) * req.groupSize

            if depart > end_mins:
                continue
            if spent + leg_cost > spendable_budget:
                continue

            spot_resp = SpotResponse(
                id=spot.id,
                name=spot.name,
                city=spot.city,
                cityName=city.name if spot.city == city.id else card.cityName,
                lat=spot.latitude,
                lng=spot.longitude,
                category=spot.category,
                crowd=spot.crowd,
                peak=spot.peak,
                walkMins=spot.walk_mins,
                cost=float(spot.cost),
                hidden=spot.hidden,
                blurb=spot.blurb,
                rating=float(spot.rating),
                reviews=spot.reviews,
                durationMins=spot.duration_mins,
                tags=spot.tags or [],
            )

            legs.append(
                ItineraryLegResponse(
                    spot=spot_resp,
                    arrive=arrive,
                    depart=depart,
                    arriveFormatted=from_mins(arrive),
                    departFormatted=from_mins(depart),
                    travelMins=travel_time,
                    cost=leg_cost,
                )
            )
            spent += leg_cost
            cursor = depart

        total_cost = spent + guide_cost
        total_transit = sum(l.travelMins for l in legs)
        finish_mins = legs[-1].depart if legs else start_mins

        # Limitations & Warnings
        limitations: List[str] = []
        if window_mins < 120:
            limitations.append("Your window is under 2 hours — the plan stays inside one neighbourhood.")
        if raw_end_mins <= start_mins:
            limitations.append("End time was before start time, so we assumed a 1-hour window.")
        if req.budget < min_req_budget:
            limitations.append(
                f"Minimum workable budget for {req.groupSize} {'person' if req.groupSize == 1 else 'people'} is ₹{int(min_req_budget)} — we planned with that instead."
            )
        if req.weather == "rain":
            limitations.append("Rain forecast: outdoor and nature stops were down-ranked in favour of covered ones.")
        if traffic_factor(start_mins) >= 1.7:
            limitations.append("You start in peak-hour traffic — travel times are padded by ~70%.")
        if req.groupSize >= 6:
            limitations.append("Groups of 6+ should pre-book seating; some stalls can't seat you together.")
        if end_mins - finish_mins > 90 and legs:
            limitations.append(f"About {end_mins - finish_mins} min of your window is left unfilled by good options nearby.")
        if not legs:
            limitations.append("Nothing fits — widen the time window or raise the budget.")

        # Alternates
        chosen_ids = {l.spot.id for l in legs}
        alternates_raw = [s for s in city_spots if s.id not in chosen_ids]
        alternates_raw.sort(key=lambda s: float(s.rating), reverse=True)
        alternates = [
            SpotResponse(
                id=s.id,
                name=s.name,
                city=s.city,
                cityName=city.name,
                lat=s.latitude,
                lng=s.longitude,
                category=s.category,
                crowd=s.crowd,
                peak=s.peak,
                walkMins=s.walk_mins,
                cost=float(s.cost),
                hidden=s.hidden,
                blurb=s.blurb,
                rating=float(s.rating),
                reviews=s.reviews,
                durationMins=s.duration_mins,
                tags=s.tags or [],
            )
            for s in alternates_raw[:3]
        ]

        # Guide responses
        guide_resps = [
            GuideResponse(
                id=g.id,
                city=g.city,
                name=g.name,
                languages=g.languages,
                focus=g.focus,
                rating=float(g.rating),
                feePerHour=float(g.fee_per_hour),
                is_available=g.is_available,
            )
            for g in guides
        ]

        assigned_guide_resp = guide_resps[0] if (req.wantGuide and guide_resps) else None

        summary = f"Generated {len(legs)} stops in {city.name} from {from_mins(start_mins)} to {from_mins(finish_mins)} within ₹{int(effective_budget)}."

        return ItineraryResponse(
            cityId=city.id,
            cityName=city.name,
            startTime=req.startTime,
            endTime=req.endTime,
            windowMins=window_mins,
            groupSize=req.groupSize,
            effectiveBudget=effective_budget,
            spentBudget=spent,
            totalCost=total_cost,
            guideCost=guide_cost,
            totalTransitMins=total_transit,
            finishMins=finish_mins,
            finishFormatted=from_mins(finish_mins),
            legs=legs,
            limitations=limitations,
            alternates=alternates,
            guides=guide_resps,
            assignedGuide=assigned_guide_resp,
            recommendedSpots=ranked_cards[:10],
            summary=summary,
        )


itinerary_engine = ItineraryEngine()
