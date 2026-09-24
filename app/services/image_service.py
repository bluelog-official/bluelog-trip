"""호환 래퍼. Pexels 검색과 Unsplash Fallback 구현은 pexels_service에 있다."""

from app.services.pexels_service import (  # noqa: F401
    UNSPLASH_FOOD_FALLBACK,
    UNSPLASH_TRAVEL_FALLBACK,
    fetch_guide_images,
    fetch_travel_image,
)
