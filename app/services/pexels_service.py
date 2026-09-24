"""Pexels 고화질 이미지 검색. 키 부재, 호출 실패, Quota 초과는 Unsplash로 대체한다."""

import os
from typing import Dict, List, Optional, Sequence

import httpx
from dotenv import load_dotenv

load_dotenv()

PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search"
MAX_GUIDE_IMAGES = 6
_QUOTA_STATUS_CODES = {402, 403, 429}

# Pexels를 쓸 수 없을 때 파이프라인이 멈추지 않도록 쓰는 고정 고화질 큐레이션
UNSPLASH_CURATION = [
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80",
]
UNSPLASH_TRAVEL_FALLBACK = UNSPLASH_CURATION[0]
UNSPLASH_FOOD_FALLBACK = UNSPLASH_CURATION[1]


def _clean_query(value: str) -> str:
    return " ".join((value or "").split())


def build_image_queries(
    destination: str,
    attractions: Optional[Sequence[str]] = None,
    food_spots: Optional[Sequence[str]] = None,
    limit: int = MAX_GUIDE_IMAGES,
) -> List[str]:
    """썸네일용 도시명 다음에 장소·음식 키워드를 중복 없이 붙인다."""
    ordered = [destination]
    ordered.extend(list(attractions or []))
    ordered.extend(list(food_spots or []))
    seen = set()
    queries: List[str] = []
    for item in ordered:
        text = _clean_query(item)
        if not text:
            continue
        key = text.casefold()
        if key in seen:
            continue
        seen.add(key)
        queries.append(text)
        if len(queries) >= limit:
            break
    if not queries:
        queries.append("travel")
    return queries


def fallback_image(query: str, index: int = 0) -> Dict[str, str]:
    """Unsplash 큐레이션 URL. 호출 순서마다 다른 사진을 고른다."""
    alt = _clean_query(query) or "travel"
    return {
        "url": UNSPLASH_CURATION[index % len(UNSPLASH_CURATION)],
        "alt": alt,
        "photographer": "Unsplash",
        "photographer_url": "https://unsplash.com",
        "source": "unsplash",
    }


def _image_from_photo(photo: Dict, query: str) -> Optional[Dict[str, str]]:
    sources = photo.get("src") or {}
    url = sources.get("large2x") or sources.get("large") or sources.get("original")
    if not url:
        return None
    alt = _clean_query(photo.get("alt") or query) or query
    return {
        "url": url,
        "alt": alt,
        "photographer": _clean_query(photo.get("photographer") or "") or "Pexels",
        "photographer_url": _clean_query(photo.get("photographer_url") or "") or "https://www.pexels.com",
        "source": "pexels",
    }


async def fetch_travel_image(query: str, fallback_index: int = 0) -> Dict[str, str]:
    """검색어에 맞는 고화질 이미지와 작가 정보를 반환한다. 실패하면 Unsplash를 돌려준다."""
    alt_query = _clean_query(query) or "travel"
    api_key = os.getenv("PEXELS_API_KEY", "").strip()
    if not api_key:
        print("⚠️ [Pexels] API 키가 없어 Unsplash 대체 이미지를 사용합니다.")
        return fallback_image(alt_query, fallback_index)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                PEXELS_SEARCH_URL,
                headers={"Authorization": api_key},
                params={"query": alt_query, "per_page": 1, "orientation": "landscape"},
            )
    except Exception as exc:  # noqa: BLE001 - 이미지 실패가 가이드 생성을 막으면 안 된다
        print("⚠️ [Pexels] 이미지 수집 실패, Unsplash 대체 URL 사용: {0}".format(exc))
        return fallback_image(alt_query, fallback_index)

    if response.status_code in _QUOTA_STATUS_CODES or response.status_code >= 400:
        print("⚠️ [Pexels] 응답 {0}, Unsplash 대체 URL 사용".format(response.status_code))
        return fallback_image(alt_query, fallback_index)

    try:
        photos = response.json().get("photos") or []
    except ValueError:
        return fallback_image(alt_query, fallback_index)
    if not photos:
        return fallback_image(alt_query, fallback_index)

    parsed = _image_from_photo(photos[0], alt_query)
    if parsed is None:
        return fallback_image(alt_query, fallback_index)
    return parsed


async def fetch_guide_images(
    destination: str,
    food_query: str = "",
    queries: Optional[Sequence[str]] = None,
) -> List[Dict[str, str]]:
    """썸네일과 섹션용 이미지를 순서대로 모은다. 항상 1장 이상을 반환한다."""
    search_terms = [_clean_query(item) for item in (queries or []) if _clean_query(item)]
    if not search_terms:
        place = _clean_query(destination) or "travel"
        dining = _clean_query(food_query) or "{0} local food".format(place)
        search_terms = build_image_queries(place, food_spots=[dining])
    search_terms = search_terms[:MAX_GUIDE_IMAGES]

    images: List[Dict[str, str]] = []
    for index, term in enumerate(search_terms):
        images.append(await fetch_travel_image(term, fallback_index=index))
    return images
