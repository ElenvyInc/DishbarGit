"""Allowlisted browser origins for CORS and payment/auth redirects."""

from __future__ import annotations

import os
from urllib.parse import urlparse

from fastapi import HTTPException

_PRODUCTION_ORIGINS = ("https://dishbar.ca", "https://www.dishbar.ca")
_LOCAL_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
)


def _is_local_env() -> bool:
    return os.getenv("ENVIRONMENT", "prod").strip().lower() in {"dev", "test", "local"}


def _split_origins(raw: str) -> list[str]:
    origins = []
    for part in raw.split(","):
        value = part.strip().rstrip("/")
        if value:
            origins.append(value)
    return origins


def allowed_redirect_origins() -> set[str]:
    raw = os.getenv("ALLOWED_REDIRECT_ORIGINS", ",".join(_PRODUCTION_ORIGINS))
    origins = set(_split_origins(raw))
    for name in ("FRONTEND_URL", "BACKEND_URL", "PYTHON_BACKEND_URL"):
        value = os.getenv(name, "").strip().rstrip("/")
        if value:
            origins.add(value)
    if _is_local_env():
        origins.update(_LOCAL_ORIGINS)
    return origins


def allowed_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOWED_ORIGINS", ",".join(_PRODUCTION_ORIGINS))
    origins = _split_origins(raw)
    frontend = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
    if frontend and frontend not in origins:
        origins.append(frontend)
    if _is_local_env():
        for extra in _LOCAL_ORIGINS:
            if extra not in origins:
                origins.append(extra)
    return origins


def resolve_allowed_origin(candidate: str | None) -> str | None:
    if not candidate:
        return None
    value = candidate.strip()
    if not value.startswith(("http://", "https://")):
        value = "https://" + value
    parsed = urlparse(value)
    if parsed.username or parsed.password or not parsed.scheme or not parsed.netloc:
        return None
    if parsed.scheme not in {"http", "https"}:
        return None
    origin = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
    if origin in allowed_redirect_origins():
        return origin
    return None


def resolve_checkout_origin(supplied: str | None) -> str:
    """Return an allowlisted origin. A request host is never used unless it is listed."""
    if supplied:
        allowed = resolve_allowed_origin(supplied)
        if not allowed:
            raise HTTPException(status_code=400, detail="Redirect host is not allowed")
        return allowed

    configured = resolve_allowed_origin(os.getenv("FRONTEND_URL", ""))
    if configured:
        return configured

    https_origins = sorted(origin for origin in allowed_redirect_origins() if origin.startswith("https://"))
    if https_origins:
        return https_origins[0]
    raise HTTPException(status_code=503, detail="No allowed redirect origin is configured")
