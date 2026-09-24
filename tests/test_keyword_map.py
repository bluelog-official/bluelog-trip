"""도시 순환 리스트와 키워드 맵이 생성 프롬프트에 주입되는지 검증한다."""

from app.agents.research_agent import build_research_prompt
from app.agents.writer_agent import build_writer_prompt
from app.schemas.guide_schema import ResearchOutput
from app.services.keyword_map import CITY_KEYWORD_MAP, resolve_city_keywords
from app.services.scheduler_service import TARGET_CITIES

FINAL_CITIES = [
    "New York",
    "Los Angeles",
    "Toronto",
    "Paris",
    "London",
    "Rome",
    "Barcelona",
    "Tokyo",
    "Singapore",
    "Seoul",
]

_MOCK_RESEARCH = ResearchOutput(
    attractions=["샘플 관광지"],
    food_spots=["샘플 맛집"],
    seo_keywords=["샘플 키워드"],
    target_currency="$",
    local_tip="샘플 팁",
)


def test_target_cities_match_final_list():
    assert TARGET_CITIES == FINAL_CITIES
    assert list(CITY_KEYWORD_MAP) == FINAL_CITIES


def test_every_city_has_keyword_profile():
    for city in TARGET_CITIES:
        profile = resolve_city_keywords(city)
        assert profile is not None, city
        assert profile.primary_keyword
        assert len(profile.long_tail_keywords) >= 3
        assert len(profile.local_food_spots) >= 2


def test_prompts_include_mapped_keywords():
    for city in TARGET_CITIES:
        profile = resolve_city_keywords(city)
        research_prompt = build_research_prompt(city, profile.primary_keyword, profile)
        writer_prompt = build_writer_prompt(city, _MOCK_RESEARCH, profile)

        assert "Primary Keyword: {0}".format(profile.primary_keyword) in research_prompt
        assert "Primary Keyword: {0}".format(profile.primary_keyword) in writer_prompt
        for keyword in profile.long_tail_keywords:
            assert keyword in research_prompt
            assert keyword in writer_prompt
        for spot in profile.local_food_spots:
            assert spot in research_prompt
            assert spot in writer_prompt


def test_request_keyword_overrides_primary_only():
    profile = resolve_city_keywords("tokyo", "도쿄 벚꽃 명소")
    assert profile is not None
    assert profile.primary_keyword == "도쿄 벚꽃 명소"
    assert profile.long_tail_keywords == CITY_KEYWORD_MAP["Tokyo"].long_tail_keywords
    prompt = build_research_prompt("Tokyo", profile.primary_keyword, profile)
    assert "Primary Keyword: 도쿄 벚꽃 명소" in prompt
    assert "도쿄 3박4일 일정" in prompt


def test_unknown_city_prompt_omits_keyword_block():
    prompt = build_research_prompt("Bali", "")
    assert "목적지: Bali" in prompt
    assert "Primary Keyword" not in prompt
    assert resolve_city_keywords("Bali") is None
