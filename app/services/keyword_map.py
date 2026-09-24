"""도시별 타겟 키워드 상수. LLM 의존성 없음."""

from typing import Dict, Optional

from app.schemas.guide_schema import CityKeywordProfile

CITY_KEYWORD_MAP: Dict[str, CityKeywordProfile] = {
    "New York": CityKeywordProfile(
        primary_keyword="뉴욕 여행 코스",
        long_tail_keywords=[
            "뉴욕 3박4일 일정",
            "뉴욕 가성비 맛집",
            "맨해튼 필수 코스",
            "뉴욕 지하철 패스",
            "뉴욕 자유여행 경비",
        ],
        local_food_spots=[
            "Katz's Delicatessen",
            "Joe's Pizza",
            "Central Park",
        ],
    ),
    "Los Angeles": CityKeywordProfile(
        primary_keyword="로스앤젤레스 여행",
        long_tail_keywords=[
            "LA 3박4일 코스",
            "산타모니카 해변 가이드",
            "할리우드 당일 일정",
            "LA 한인타운 맛집",
            "로스앤젤레스 렌트카 팁",
        ],
        local_food_spots=[
            "In-N-Out Burger",
            "Grand Central Market",
            "Santa Monica Pier",
        ],
    ),
    "Toronto": CityKeywordProfile(
        primary_keyword="토론토 여행",
        long_tail_keywords=[
            "토론토 3박4일 코스",
            "CN타워 전망 팁",
            "토론토 가성비 맛집",
            "나이아가라 당일 투어",
            "토론토 대중교통 패스",
        ],
        local_food_spots=[
            "St. Lawrence Market",
            "Kensington Market",
            "CN Tower",
        ],
    ),
    "Paris": CityKeywordProfile(
        primary_keyword="파리 여행 코스",
        long_tail_keywords=[
            "파리 4박5일 일정",
            "파리 박물관 패스",
            "파리 가성비 맛집",
            "에펠탑 야경 팁",
            "파리 지하철 이용법",
        ],
        local_food_spots=[
            "Ladurée 마카롱",
            "Latin Quarter 크레페",
            "Eiffel Tower",
        ],
    ),
    "London": CityKeywordProfile(
        primary_keyword="런던 여행 코스",
        long_tail_keywords=[
            "런던 3박4일 일정",
            "런던 패스 가성비",
            "런던 뮤지컬 예매",
            "코벤트 가든 맛집",
            "런던 오이스터 카드",
        ],
        local_food_spots=[
            "Borough Market",
            "Fish and Chips",
            "Covent Garden",
        ],
    ),
    "Rome": CityKeywordProfile(
        primary_keyword="로마 여행 코스",
        long_tail_keywords=[
            "로마 3박4일 일정",
            "콜로세움 예약 팁",
            "로마 젤라또 맛집",
            "바티칸 관람 순서",
            "로마 트라스테베레 저녁",
        ],
        local_food_spots=[
            "Trapizzino",
            "로마 카보나라",
            "Colosseum",
        ],
    ),
    "Barcelona": CityKeywordProfile(
        primary_keyword="바르셀로나 여행",
        long_tail_keywords=[
            "바르셀로나 3박4일 코스",
            "사그라다 파밀리아 예약",
            "고딕지구 산책",
            "바르셀로나 타파스",
            "바르셀로나 지하철 패스",
        ],
        local_food_spots=[
            "La Boqueria",
            "바르셀로나 파에야",
            "Sagrada Familia",
        ],
    ),
    "Tokyo": CityKeywordProfile(
        primary_keyword="도쿄 여행 코스",
        long_tail_keywords=[
            "도쿄 3박4일 일정",
            "도쿄 가성비 라멘",
            "시부야 하루 코스",
            "도쿄 스카이트리 야경",
            "스이카 교통패스",
        ],
        local_food_spots=[
            "이치란 라멘",
            "츠키지 시장",
            "Shibuya Crossing",
        ],
    ),
    "Singapore": CityKeywordProfile(
        primary_keyword="싱가포르 여행",
        long_tail_keywords=[
            "싱가포르 3박4일 코스",
            "마리나베이 야경",
            "싱가포르 호커센터",
            "가든스 바이 더 베이",
            "싱가포르 교통카드",
        ],
        local_food_spots=[
            "Maxwell Food Centre 치킨라이스",
            "Laksa",
            "Gardens by the Bay",
        ],
    ),
    "Seoul": CityKeywordProfile(
        primary_keyword="서울 여행 코스",
        long_tail_keywords=[
            "서울 2박3일 일정",
            "서울 가성비 맛집",
            "한강 야경 코스",
            "경복궁 한복 체험",
            "서울 지하철 1일권",
        ],
        local_food_spots=[
            "광장시장 빈대떡",
            "명동 칼국수",
            "Gyeongbokgung",
        ],
    ),
}

_CITY_INDEX = {name.casefold(): profile for name, profile in CITY_KEYWORD_MAP.items()}


def resolve_city_keywords(destination: str, keyword: str = "") -> Optional[CityKeywordProfile]:
    """도시 이름으로 키워드 프로필을 찾는다. keyword가 있으면 Primary를 그 값으로 덮는다."""
    profile = _CITY_INDEX.get(destination.strip().casefold())
    if profile is None:
        return None
    override = keyword.strip()
    if override and override != profile.primary_keyword:
        return profile.model_copy(update={"primary_keyword": override})
    return profile


def format_keyword_context(profile: Optional[CityKeywordProfile]) -> str:
    """프롬프트에 그대로 붙일 키워드 블록. 프로필이 없으면 빈 문자열."""
    if profile is None or not profile.primary_keyword:
        return ""
    return "\n".join(
        [
            "[도시 타겟 키워드]",
            "- Primary Keyword: {0}".format(profile.primary_keyword),
            "- Long-tail Keywords: {0}".format(", ".join(profile.long_tail_keywords)),
            "- Local Food/Spot: {0}".format(", ".join(profile.local_food_spots)),
        ]
    )
