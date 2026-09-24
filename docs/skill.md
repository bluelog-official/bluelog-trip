# Multi-Agent Skill & Contract Architecture

레이어 순서: `app/schemas` → `app/services` → `app/agents` → `app/main.py`

## 0. Data Contracts (`app/schemas/guide_schema.py`)

에이전트 간 교환되는 유일한 DTO 정의다.

```python
class GenerateRequest(BaseModel):
    destination: str
    keyword: str = ""

class CityKeywordProfile(BaseModel):
    primary_keyword: str         # 도시 대표 검색 키워드
    long_tail_keywords: list[str]
    local_food_spots: list[str]  # 현지 음식 또는 스팟

class ResearchOutput(BaseModel):
    attractions: list[str]       # 필수 관광지 3곳
    food_spots: list[str]        # 가성비/로컬 맛집 3곳
    seo_keywords: list[str]      # 롱테일 SEO 키워드 5개
    target_currency: str         # 통화 기호 (예: $, ¥, ₩)
    local_tip: str               # 현지인만 아는 꿀팁 1가지

class QAOutput(BaseModel):
    is_approved: bool
    quality_score: int           # 0~100
    violations: list[str]

class RedditSyndication(BaseModel):
    subreddit: str
    title: str
    body: str

class QuoraSyndication(BaseModel):
    question: str
    answer: str

class PinterestSyndication(BaseModel):
    board: str
    pin_title: str
    description: str
    image_alt: str

class BacklinkSyndication(BaseModel):
    anchor_text: str
    target_path: str
    outreach_note: str

class SyndicationOutput(BaseModel):
    social_teasers: list[str]
    platform_hashtags: list[str]
    reddit: RedditSyndication
    quora: QuoraSyndication
    pinterest: PinterestSyndication
    backlink: BacklinkSyndication

class GenerateResponse(BaseModel):
    article_markdown: str
    qa_result: QAOutput
    syndication: SyndicationOutput
    research_model: str          # Research Agent가 실제로 사용한 모델명
    writer_model: str            # Writer Agent가 실제로 사용한 모델명
```

`ResearchOutput`의 5개 필드는 모두 필수다. 백업 LLM의 느슨한 응답은
검증 전에 Sanitizer가 이 구조로 맞춰 주므로 스키마를 느슨하게 풀지 않는다.

## 1. JSON Sanitizer (`app/services/json_sanitizer.py`)

- **Role:** LLM 원문 응답을 `ResearchOutput` 계약 JSON으로 정제하는 순수 로직. LLM SDK 의존성 0%.
- **Entry point:** `normalize_research_json(raw_text: str) -> str`
- **처리 단계:** 마크다운 백틱 제거 → 잡담 사이에서 JSON 본문만 추출 →
  느슨한 문법(후행 콤마, 파이썬 리터럴) 보정 → 래퍼 키(`{"research": {...}}`) 해제 →
  키 별칭 매핑(`top_attractions`/`restaurants`/`currency` 등) → 타입 강제 변환.
- **보장:** 반환된 JSON에는 계약 키 5개가 항상 존재한다. 비어 있는 키는
  `missing_research_fields()`로 확인해 경고를 남긴다.

## 2. Guide Service (`app/services/guide_service.py`)

- **Role:** QA 규칙 평가, 신디케이션 문구 생성, 가이드 메모리 저장소. 순수 로직.
- `evaluate_article()`: H2 소제목 / 마크다운 표 / 본문 분량을 점검해 75점 이상이면 승인.
- `inject_images_below_h2()`: H2 바로 아래에 `![설명](url)`을 최대 2장 삽입.
- `build_generate_response()`, `save_guide()`, `get_guide()`, `list_guides()`.

## 2-0. Keyword Map (`app/services/keyword_map.py`)

- **Role:** 스케줄 대상 10개 도시의 Primary Keyword, Long-tail Keywords, Local Food/Spot 상수.
- **Entry point:** `resolve_city_keywords(destination, keyword="") -> CityKeywordProfile | None`
- `format_keyword_context()`가 위 세 필드를 `[도시 타겟 키워드]` 블록으로 만들어 Research/Writer 프롬프트에 주입한다.
- 요청 `keyword`가 있으면 해당 도시의 Primary Keyword만 그 값으로 덮는다.

## 2-1. Image Service (`app/services/image_service.py`)

- **Role:** Pexels 검색으로 여행지/음식 이미지 URL을 수집. LLM 의존성 없음.
- **Entry point:** `fetch_guide_images(destination, food_query="") -> [{"url", "alt"}, ...]`
- `PEXELS_API_KEY`가 없거나 호출이 실패하면 Unsplash 썸네일 URL을 반환하고 파이프라인은 계속된다.

## 3. LLM Harness (`app/agents/utils.py`)

- **Role:** Gemini 직접 호출 → 실패 시 OpenRouter 우회하는 공용 하네스.
- **Entry point:** `generate_with_fallback(prompt, system_prompt, config, expect_json) -> (원문, 사용 모델명)`
- Gemini 모델 체인을 먼저 순회한 뒤, 전부 실패하면 OpenRouter 모델 체인으로 넘어간다.
- `FORCE_LLM_FALLBACK=1` 환경변수로 백업 경로를 강제 검증할 수 있다.

## 4. Research Agent (`app/agents/research_agent.py`)

- **Role:** 목적지의 관광지·맛집·SEO 키워드·통화·로컬 팁 수집.
- **Signature:** `run_research_agent(destination, keyword="", profile=None) -> (ResearchOutput, research_model)`
- `profile`이 없으면 `resolve_city_keywords()`로 도시 키워드를 찾아 프롬프트에 넣는다.
- 응답은 **반드시** `normalize_research_json()`을 거친 뒤 `ResearchOutput.model_validate_json()`으로 검증한다.

## 5. Writer Agent (`app/agents/writer_agent.py`)

- **Role:** 리서치 데이터를 AdSense 최적화 한국어 마크다운 아티클로 작성.
- **Signature:** `run_writer_agent(destination, research, profile=None) -> (article_markdown, writer_model)`
- 도시 키워드 프로필이 있으면 Primary Keyword, Long-tail Keywords, Local Food/Spot을 작성 규칙에 포함한다.
- 마크다운 표(카테고리·추천 장소·예상 비용·별점)와 H2/H3 구조를 필수로 요구한다.

## 6. API Layer (`app/main.py`)

라우팅과 HTTP 예외 변환만 담당한다.

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/v1/generate-guide` | 가이드 생성 (Research → Writer → Pexels → Syndication → QA → 저장) |
| POST | `/api/v1/cron/trigger` | 도시 큐의 다음 목적지를 검수 전 초안으로 저장한다. sitemap과 Google ping은 보내지 않는다 |
| GET | `/api/v1/cron/status` | 스케줄러 실행 여부와 다음 실행 시각 |
| GET | `/api/v1/sitemap.xml` | 승인된 가이드만 포함한 sitemap |
| GET | `/api/v1/guides` | 생성된 가이드 목록 |
| GET | `/api/v1/guides/{guide_id}` | 가이드 상세. 승인 전에는 `qa_result.is_approved`가 false |
| POST | `/api/v1/guides/{guide_id}/approve` | 휴먼 리뷰 승인. `is_approved`를 true로 바꾸고 sitemap 갱신 후 Google ping |

`/guides`, `/guides/{guide_id}`는 프론트엔드 호환용 동일 라우트다.
