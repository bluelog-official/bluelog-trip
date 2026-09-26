"""관리자 자격 증명 확인과 Bearer 토큰 발급·검증. LLM에 의존하지 않는다."""

import hashlib
import hmac
import json
import os
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode
from binascii import Error as BinasciiError
from typing import Optional

DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "bluelog123!"
TOKEN_TTL_SECONDS = 12 * 60 * 60


def admin_username() -> str:
    return os.getenv("ADMIN_USERNAME", DEFAULT_ADMIN_USERNAME)


def admin_password() -> str:
    return os.getenv("ADMIN_PASSWORD", DEFAULT_ADMIN_PASSWORD)


def _digest(value: str) -> bytes:
    return hashlib.sha256((value or "").encode("utf-8")).digest()


def _matches(provided: str, expected: str) -> bool:
    return hmac.compare_digest(_digest(provided), _digest(expected))


def _signing_key() -> bytes:
    secret = os.getenv("ADMIN_TOKEN_SECRET") or admin_password()
    return hashlib.sha256(secret.encode("utf-8")).digest()


def _b64encode(raw: bytes) -> str:
    return urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padded = value + ("=" * (-len(value) % 4))
    return urlsafe_b64decode(padded.encode("ascii"))


def issue_admin_token(username: Optional[str] = None, now: Optional[int] = None) -> str:
    issued_at = int(time.time() if now is None else now)
    payload = {
        "sub": username or admin_username(),
        "exp": issued_at + TOKEN_TTL_SECONDS,
    }
    body = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(_signing_key(), body.encode("ascii"), hashlib.sha256).hexdigest()
    return "{0}.{1}".format(body, signature)


def token_is_valid(token: str, now: Optional[int] = None) -> bool:
    if not token or token.count(".") != 1:
        return False
    body, signature = token.split(".", 1)
    if not body or not signature:
        return False
    expected = hmac.new(_signing_key(), body.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return False
    try:
        payload = json.loads(_b64decode(body).decode("utf-8"))
        subject = payload["sub"]
        expires_at = int(payload["exp"])
    except (KeyError, TypeError, ValueError, json.JSONDecodeError, UnicodeError, BinasciiError):
        return False
    if not isinstance(subject, str):
        return False
    current = int(time.time() if now is None else now)
    if expires_at < current:
        return False
    return _matches(subject, admin_username())


def authenticate_admin(username: str, password: str) -> Optional[str]:
    user_ok = _matches(username or "", admin_username())
    pass_ok = _matches(password or "", admin_password())
    if not (user_ok and pass_ok):
        return None
    return issue_admin_token(admin_username())


def authorization_is_valid(authorization: str) -> bool:
    if not authorization:
        return False
    scheme, separator, token = authorization.strip().partition(" ")
    if separator != " " or scheme.lower() != "bearer":
        return False
    token = token.strip()
    if not token or any(char.isspace() for char in token):
        return False
    return token_is_valid(token)
