from typing import Dict, Tuple

# Baseline curated weather condition & temperature for Maharashtra cities
CITY_WEATHER_DEFAULTS: Dict[str, Tuple[str, float]] = {
    "mumbai": ("Humid & clear", 31.0),
    "pune": ("Pleasant breeze", 27.0),
    "chhatrapati-sambhajinagar": ("Dry & warm", 34.0),
    "mahabaleshwar": ("Misty drizzle", 21.0),
    "nashik": ("Cool & clear", 26.0),
    "kolhapur": ("Warm & bright", 30.0),
    "nagpur": ("Dry & hot", 36.0),
    "ratnagiri": ("Breezy & humid", 29.0),
}


class WeatherService:
    @staticmethod
    def get_city_weather(city_id: str) -> Tuple[str, float]:
        """Return weather condition and temperature for a given city ID."""
        return CITY_WEATHER_DEFAULTS.get(city_id.lower(), ("Pleasant & clear", 26.0))


weather_service = WeatherService()
