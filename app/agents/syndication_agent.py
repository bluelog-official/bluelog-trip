"""플랫폼별 홍보 초안을 Research 데이터에서 조립한다."""

from typing import List, Optional

from app.schemas.guide_schema import (
    BacklinkSyndication,
    PinterestSyndication,
    QuoraSyndication,
    RedditSyndication,
    ResearchOutput,
    SyndicationOutput,
)


def _join(items: List[str], limit: int) -> str:
    picked = [item.strip() for item in items if item and item.strip()][:limit]
    return ", ".join(picked)


def is_english_language(target_language: str) -> bool:
    normalized = (target_language or "").strip().lower()
    return normalized in {"en", "english"}


def run_syndication_agent(
    destination: str,
    research: Optional[ResearchOutput] = None,
    guide_id: str = "",
    target_language: str = "ko",
) -> SyndicationOutput:
    """Reddit, Quora, Pinterest, 백링크용 초안을 각각 독립 구조로 만든다."""
    place = destination.strip() or "this city"
    slug = guide_id or "{0}_guide.md".format(place.lower().replace(" ", "_"))
    attractions = _join(research.attractions, 3) if research else ""
    foods = _join(research.food_spots, 3) if research else ""
    keywords = list(research.seo_keywords) if research else []
    tip = research.local_tip.strip() if research and research.local_tip else ""
    currency = research.target_currency.strip() if research and research.target_currency else ""
    if is_english_language(target_language):
        return _english_syndication(place, slug, attractions, foods, keywords, tip, currency)
    return _korean_syndication(place, slug, attractions, foods, keywords, tip, currency)


def _english_syndication(
    place: str,
    slug: str,
    attractions: str,
    foods: str,
    keywords: List[str],
    tip: str,
    currency: str,
) -> SyndicationOutput:
    """글로벌 채널용 영문 티저. 작성 언어가 English일 때 사용한다."""
    teasers = ["A short local route through {0}".format(place)]
    if foods:
        teasers.append("Where to eat first in {0}: {1}".format(place, foods))
    if tip:
        teasers.append(tip)

    hashtags = ["#travel", "#{0}".format(place.replace(" ", ""))]
    hashtags.extend("#{0}".format(keyword.replace(" ", "")) for keyword in keywords[:3])

    attraction_line = attractions or "the main sights"
    food_line = foods or "local food"
    tip_line = tip or "Starting early keeps both the lines and the budget down."
    cost_line = (
        "Costs below are listed in {0}, split between meals and tickets.".format(currency)
        if currency
        else "Meal and ticket costs are listed separately."
    )

    return SyndicationOutput(
        social_teasers=teasers,
        platform_hashtags=hashtags,
        reddit=RedditSyndication(
            subreddit="travel",
            title="The {0} route that actually helped on a first visit".format(place),
            body=(
                "For a first visit to {0}, I grouped sights ({1}) and meals ({2}) into one walking day. "
                "{3} {4}"
            ).format(place, attraction_line, food_line, tip_line, cost_line),
        ),
        quora=QuoraSyndication(
            question="What should you prioritize on a first trip to {0}?".format(place),
            answer=(
                "On a short trip, see {0} first and pick meals from {1} that sit on the same route. "
                "{2}"
            ).format(attraction_line, food_line, tip_line),
        ),
        pinterest=PinterestSyndication(
            board="{0} travel ideas".format(place),
            pin_title="{0} travel route and where to eat".format(place),
            description="{0} · {1}. {2}".format(attraction_line, food_line, tip_line),
            image_alt="{0} travel scene".format(place),
        ),
        backlink=BacklinkSyndication(
            anchor_text="{0} travel guide".format(place),
            target_path="/guides/{0}".format(slug),
            outreach_note=(
                "The {0} guide compares {1} and {2} on the same route, and {3}"
            ).format(place, attraction_line, food_line, cost_line),
        ),
    )


def _korean_syndication(
    place: str,
    slug: str,
    attractions: str,
    foods: str,
    keywords: List[str],
    tip: str,
    currency: str,
) -> SyndicationOutput:

    teasers = ["{0}에서 현지인처럼 움직이는 짧은 동선".format(place)]
    if foods:
        teasers.append("{0}에서 먼저 가볼 곳: {1}".format(place, foods))
    if tip:
        teasers.append(tip)

    hashtags = ["#travel", "#{0}".format(place.replace(" ", ""))]
    hashtags.extend("#{0}".format(keyword.replace(" ", "")) for keyword in keywords[:3])

    attraction_line = attractions or "주요 관광지"
    food_line = foods or "로컬 맛집"
    tip_line = tip or "이른 시간대에 동선을 시작하면 대기와 비용을 함께 줄일 수 있다."
    cost_line = "{0} 기준으로 식비와 입장료를 나눠 적었다.".format(currency) if currency else "식비와 입장료를 항목별로 나눠 적었다."

    return SyndicationOutput(
        social_teasers=teasers,
        platform_hashtags=hashtags,
        reddit=RedditSyndication(
            subreddit="travel",
            title="{0} 첫 방문 때 실제로 도움이 됐던 동선".format(place),
            body=(
                "{0}을 처음 가는 기준으로 관광지({1})와 식사({2})를 하루 동선으로 묶어 봤다. "
                "{3} {4}"
            ).format(place, attraction_line, food_line, tip_line, cost_line),
        ),
        quora=QuoraSyndication(
            question="{0}에 처음 가면 어디를 우선해야 할까?".format(place),
            answer=(
                "일정이 짧다면 {0}을 먼저 보고, 식사는 {1} 중에서 동선에 걸리는 곳을 고르는 편이 낫다. "
                "{2}"
            ).format(attraction_line, food_line, tip_line),
        ),
        pinterest=PinterestSyndication(
            board="{0} travel ideas".format(place),
            pin_title="{0} 여행 동선과 식사".format(place),
            description="{0} · {1}. {2}".format(attraction_line, food_line, tip_line),
            image_alt="{0} travel scene".format(place),
        ),
        backlink=BacklinkSyndication(
            anchor_text="{0} 여행 가이드".format(place),
            target_path="/guides/{0}".format(slug),
            outreach_note=(
                "{0} 가이드는 {1}와 {2}를 같은 동선에서 비교하고, {3}"
            ).format(place, attraction_line, food_line, cost_line),
        ),
    )
