"""LLM 응답 텍스트를 ResearchOutput 계약에 맞춘 JSON으로 정제하는 순수 로직.

이 모듈은 LLM SDK에 전혀 의존하지 않는다(입력은 항상 평범한 문자열).
백업 모델(OpenRouter)이 마크다운 백틱을 감싸거나 키 이름을 조금 다르게
반환하더라도 Pydantic ValidationError 없이 검증되도록 보정하는 것이 목적이다.
"""

import ast
import json
import re
from typing import Any, Dict, List, Optional, Sequence, Tuple

# ResearchOutput 계약 키 (검증 직전 항상 이 5개가 모두 존재해야 한다)
RESEARCH_FIELDS: Tuple[str, ...] = (
    "attractions",
    "food_spots",
    "seo_keywords",
    "target_currency",
    "local_tip",
)

# 정규화된(영숫자만 남긴) 키 -> 계약 키 직접 매핑
_FIELD_ALIASES: Dict[str, str] = {
    # attractions
    "attractions": "attractions",
    "attraction": "attractions",
    "topattractions": "attractions",
    "mustvisit": "attractions",
    "mustvisitattractions": "attractions",
    "mustseeattractions": "attractions",
    "touristattractions": "attractions",
    "placestovisit": "attractions",
    "pointsofinterest": "attractions",
    "landmarks": "attractions",
    "sights": "attractions",
    "sightseeing": "attractions",
    "관광지": "attractions",
    # food_spots
    "foodspots": "food_spots",
    "foodspot": "food_spots",
    "food": "food_spots",
    "foods": "food_spots",
    "restaurants": "food_spots",
    "localrestaurants": "food_spots",
    "localfood": "food_spots",
    "foodplaces": "food_spots",
    "eateries": "food_spots",
    "dining": "food_spots",
    "diningspots": "food_spots",
    "wheretoeat": "food_spots",
    "맛집": "food_spots",
    # seo_keywords
    "seokeywords": "seo_keywords",
    "seokeyword": "seo_keywords",
    "keywords": "seo_keywords",
    "keyword": "seo_keywords",
    "searchkeywords": "seo_keywords",
    "longtailkeywords": "seo_keywords",
    "seo": "seo_keywords",
    "키워드": "seo_keywords",
    # target_currency
    "targetcurrency": "target_currency",
    "currency": "target_currency",
    "currencysymbol": "target_currency",
    "localcurrency": "target_currency",
    "currencycode": "target_currency",
    "money": "target_currency",
    "통화": "target_currency",
    # local_tip
    "localtip": "local_tip",
    "localtips": "local_tip",
    "insidertip": "local_tip",
    "insidertips": "local_tip",
    "tip": "local_tip",
    "tips": "local_tip",
    "localsecret": "local_tip",
    "hiddengem": "local_tip",
    "traveltip": "local_tip",
    "꿀팁": "local_tip",
}

# 직접 매핑에 실패했을 때 사용할 부분 일치 규칙 (우선순위 순서 유지)
_FIELD_KEYWORDS: Sequence[Tuple[str, Tuple[str, ...]]] = (
    ("seo_keywords", ("seo", "keyword", "키워드")),
    ("target_currency", ("currency", "통화")),
    ("food_spots", ("food", "restaurant", "eat", "dining", "cuisine", "맛집")),
    ("attractions", ("attraction", "sight", "landmark", "placesto", "spot", "관광")),
    ("local_tip", ("tip", "secret", "insider", "advice", "꿀팁")),
)

# 응답 전체가 한 겹 더 감싸져 있을 때 벗겨낼 래퍼 키
_WRAPPER_KEYS = frozenset(
    {"research", "researchoutput", "result", "results", "data", "output", "response", "json", "payload"}
)

# 리스트 원소가 dict일 때 대표 문자열로 사용할 후보 키
_LABEL_KEYS = (
    "name",
    "title",
    "place",
    "spot",
    "attraction",
    "restaurant",
    "keyword",
    "label",
    "text",
    "value",
    "item",
    "tip",
    "description",
)

_CODE_FENCE_BLOCK = re.compile(r"```[a-zA-Z0-9_+-]*[ \t]*\r?\n?(.*?)```", re.DOTALL)
_TRAILING_COMMA = re.compile(r",(\s*[}\]])")
_BULLET_PREFIX = re.compile(r"^\s*(?:[-*•]|\d+[.)])\s*")
_LIST_SEPARATOR = re.compile(r"[\n;]+|,")


def strip_code_fences(raw_text: str) -> str:
    """마크다운 코드 블록(```json ... ```)을 제거하고 내부 본문만 돌려준다."""
    if not raw_text:
        return ""

    text = raw_text.strip()
    block = _CODE_FENCE_BLOCK.search(text)
    if block:
        return block.group(1).strip()

    # 닫는 백틱이 잘려 나간 경우를 대비해 남은 백틱을 전부 털어낸다.
    text = re.sub(r"```[a-zA-Z0-9_+-]*", "", text).replace("```", "")
    return text.strip()


def extract_json_snippet(text: str) -> str:
    """설명 문장에 섞인 응답에서 최외곽 JSON 객체/배열만 잘라낸다."""
    if not text:
        return ""

    start = min(
        (pos for pos in (text.find("{"), text.find("[")) if pos != -1),
        default=-1,
    )
    if start == -1:
        return text.strip()

    opener = text[start]
    closer = "}" if opener == "{" else "]"
    depth = 0
    in_string = False
    escaped = False

    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == opener:
            depth += 1
        elif char == closer:
            depth -= 1
            if depth == 0:
                return text[start : index + 1]

    # 닫는 괄호가 없으면(응답 잘림) 남은 뒷부분을 그대로 넘겨 관대한 파서에 맡긴다.
    return text[start:].strip()


def loads_relaxed(text: str) -> Any:
    """표준 JSON 파싱 실패 시 흔한 LLM 문법 오류를 보정해 다시 시도한다."""
    if not text or not text.strip():
        raise ValueError("빈 문자열은 JSON으로 파싱할 수 없습니다.")

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    without_trailing_comma = _TRAILING_COMMA.sub(r"\1", text)
    try:
        return json.loads(without_trailing_comma)
    except json.JSONDecodeError:
        pass

    # 작은따옴표/True/False/None 같은 파이썬 리터럴 스타일 응답 대응
    try:
        return ast.literal_eval(without_trailing_comma)
    except (ValueError, SyntaxError) as exc:
        raise ValueError("LLM 응답을 JSON으로 해석하지 못했습니다: {0}".format(text[:200])) from exc


def _canonical_key(key: str) -> str:
    return re.sub(r"[^0-9a-z가-힣]", "", str(key).lower())


def _match_field(key: str) -> Optional[str]:
    """임의의 응답 키를 ResearchOutput 계약 키로 해석한다."""
    canonical = _canonical_key(key)
    if not canonical:
        return None

    direct = _FIELD_ALIASES.get(canonical)
    if direct:
        return direct

    for field, markers in _FIELD_KEYWORDS:
        if any(marker in canonical for marker in markers):
            return field
    return None


def _label_from_mapping(value: Dict[str, Any]) -> str:
    for key in _LABEL_KEYS:
        for raw_key, raw_value in value.items():
            if _canonical_key(raw_key) == key and isinstance(raw_value, (str, int, float)):
                text = str(raw_value).strip()
                if text:
                    return text
    scalars = [str(v).strip() for v in value.values() if isinstance(v, (str, int, float)) and str(v).strip()]
    return " - ".join(scalars)


def _split_text_to_items(value: str) -> List[str]:
    items = []
    for chunk in _LIST_SEPARATOR.split(value):
        item = _BULLET_PREFIX.sub("", chunk).strip().strip('"')
        if item:
            items.append(item)
    return items


def as_str_list(value: Any) -> List[str]:
    """어떤 형태로 오든 문자열 리스트로 눕힌다."""
    if value is None:
        return []
    if isinstance(value, str):
        return _split_text_to_items(value)
    if isinstance(value, dict):
        label = _label_from_mapping(value)
        return [label] if label else []
    if isinstance(value, (list, tuple, set)):
        items: List[str] = []
        for element in value:
            if isinstance(element, dict):
                label = _label_from_mapping(element)
                if label:
                    items.append(label)
            elif isinstance(element, (list, tuple, set)):
                items.extend(as_str_list(element))
            elif element is not None:
                text = str(element).strip()
                if text:
                    items.append(text)
        return items
    return [str(value).strip()]


def as_text(value: Any) -> str:
    """어떤 형태로 오든 단일 문자열로 합친다."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        return _label_from_mapping(value)
    if isinstance(value, (list, tuple, set)):
        parts = [part for part in (as_text(element) for element in value) if part]
        return " / ".join(parts)
    return str(value).strip()


def _unwrap(payload: Any) -> Any:
    """{"research": {...}} 처럼 한 겹 더 감싼 응답을 벗겨낸다."""
    for _ in range(3):
        if isinstance(payload, list):
            mappings = [item for item in payload if isinstance(item, dict)]
            if not mappings:
                break
            payload = mappings[0]
            continue

        if not isinstance(payload, dict):
            break

        # 계약 키로 해석되는 항목이 이미 있으면 현재 깊이가 본문이다.
        if any(_match_field(key) for key in payload):
            break

        nested = [v for k, v in payload.items() if _canonical_key(k) in _WRAPPER_KEYS and isinstance(v, (dict, list))]
        if not nested and len(payload) == 1:
            only_value = next(iter(payload.values()))
            if isinstance(only_value, (dict, list)):
                nested = [only_value]
        if not nested:
            break
        payload = nested[0]

    return payload


def normalize_research_payload(payload: Any) -> Dict[str, Any]:
    """임의의 파싱 결과를 ResearchOutput 키 구조의 dict로 변환한다."""
    payload = _unwrap(payload)
    if not isinstance(payload, dict):
        payload = {}

    mapped: Dict[str, Any] = {}
    for raw_key, raw_value in payload.items():
        field = _match_field(raw_key)
        # 먼저 매칭된 키를 우선한다(계약 키와 정확히 같은 이름이면 덮어쓴다).
        if field and (field not in mapped or _canonical_key(raw_key) == _canonical_key(field)):
            mapped[field] = raw_value

    return {
        "attractions": as_str_list(mapped.get("attractions")),
        "food_spots": as_str_list(mapped.get("food_spots")),
        "seo_keywords": as_str_list(mapped.get("seo_keywords")),
        "target_currency": as_text(mapped.get("target_currency")),
        "local_tip": as_text(mapped.get("local_tip")),
    }


def normalize_research_json(raw_text: str) -> str:
    """LLM 원문 응답 -> ResearchOutput.model_validate_json()에 바로 넣을 JSON 문자열.

    마크다운 백틱 제거, 잡담 문장 제거, 느슨한 JSON 문법 보정, 키 이름 매핑,
    타입 강제 변환까지 한 번에 처리한다.
    """
    snippet = extract_json_snippet(strip_code_fences(raw_text or ""))
    payload = loads_relaxed(snippet)
    return json.dumps(normalize_research_payload(payload), ensure_ascii=False)


def missing_research_fields(raw_json: str) -> List[str]:
    """정제 결과에서 값이 비어 있는 계약 키 목록(품질 경고용)."""
    payload = json.loads(raw_json)
    return [field for field in RESEARCH_FIELDS if not payload.get(field)]
