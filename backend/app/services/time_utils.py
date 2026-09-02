import re
from typing import Tuple

DaySlot = str  # "dawn" | "morning" | "afternoon" | "evening" | "night"


def to_mins(time_str: str) -> int:
    """Convert 'HH:MM' string to minutes from midnight."""
    parts = time_str.split(":")
    h = int(parts[0])
    m = int(parts[1]) if len(parts) > 1 else 0
    return h * 60 + m


def from_mins(total: int) -> str:
    """Convert total minutes from midnight to 'H:MM AM/PM'."""
    t = ((total % 1440) + 1440) % 1440
    h = t // 60
    m = t % 60
    suffix = "PM" if h >= 12 else "AM"
    hour12 = 12 if h % 12 == 0 else h % 12
    return f"{hour12}:{m:02d} {suffix}"


def slot_from_mins(mins: int) -> DaySlot:
    """Classify minutes into a day slot."""
    hour = (((mins % 1440) + 1440) % 1440) // 60
    if hour < 6:
        return "dawn"
    if hour < 12:
        return "morning"
    if hour < 17:
        return "afternoon"
    if hour < 21:
        return "evening"
    return "night"


def parse_clock_token(raw: str) -> int:
    s = raw.strip().lower().replace(".", "")
    m = re.match(r"^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$", s)
    if not m:
        return 540  # default 9:00 AM
    h = int(m.group(1))
    min_val = int(m.group(2)) if m.group(2) else 0
    ap = m.group(3)
    if ap == "pm" and h < 12:
        h += 12
    if ap == "am" and h == 12:
        h = 0
    if not ap and h == 24:
        h = 0
    return h * 60 + min_val


def parse_peak_window(peak: str) -> Tuple[int, int]:
    """Parse strings like '6–9 AM', '9 PM–1 AM', '11 AM–4 PM', '5:45–7 AM'."""
    cleaned = peak.replace("–", "-").replace("—", "-").strip()
    parts = [p.strip() for p in cleaned.split("-") if p.strip()]
    if len(parts) < 2:
        return 540, 1080

    end_has_ap = bool(re.search(r"am|pm", parts[1], re.IGNORECASE))
    start_has_ap = bool(re.search(r"am|pm", parts[0], re.IGNORECASE))
    start_raw = parts[0]
    end_raw = parts[1]

    if not start_has_ap and end_has_ap:
        ap_match = re.search(r"am|pm", end_raw, re.IGNORECASE)
        ap = ap_match.group(0) if ap_match else ""
        start_raw = f"{start_raw} {ap}"

    start = parse_clock_token(start_raw)
    end = parse_clock_token(end_raw)
    if end <= start:
        end += 1440
    return start, end


def mins_in_window(mins: int, start: int, end: int) -> bool:
    t = ((mins % 1440) + 1440) % 1440
    s = ((start % 1440) + 1440) % 1440
    e = end
    if e <= s:
        e += 1440
    t2 = t + 1440 if t < s else t
    return s <= t2 <= e


def minutes_until_window(mins: int, start: int, end: int) -> int:
    if mins_in_window(mins, start, end):
        return 0
    t = ((mins % 1440) + 1440) % 1440
    s = ((start % 1440) + 1440) % 1440
    return (s - t + 1440) % 1440


def traffic_factor(mins: int) -> float:
    """Multiplier applied to travel time during peak traffic hours."""
    hour = (((mins % 1440) + 1440) % 1440) // 60
    if (9 <= hour < 12) or (17 <= hour < 21):
        return 1.7
    if (7 <= hour < 9) or (12 <= hour < 17):
        return 1.25
    return 1.0


def traffic_label(mins: int) -> str:
    f = traffic_factor(mins)
    if f >= 1.7:
        return "Heavy traffic"
    if f > 1.0:
        return "Moderate traffic"
    return "Clear roads"
