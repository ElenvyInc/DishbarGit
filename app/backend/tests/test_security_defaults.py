from fastapi import HTTPException

from core.redirects import allowed_cors_origins, resolve_checkout_origin


def test_production_cors_does_not_allow_localhost(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "prod")
    monkeypatch.delenv("CORS_ALLOWED_ORIGINS", raising=False)
    monkeypatch.delenv("FRONTEND_URL", raising=False)
    origins = allowed_cors_origins()
    assert "https://dishbar.ca" in origins
    assert "https://www.dishbar.ca" in origins
    assert all("localhost" not in origin and "127.0.0.1" not in origin for origin in origins)
    assert "*" not in origins


def test_unlisted_redirect_host_is_rejected(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "prod")
    monkeypatch.setenv("ALLOWED_REDIRECT_ORIGINS", "https://dishbar.ca,https://www.dishbar.ca")
    monkeypatch.setenv("FRONTEND_URL", "https://dishbar.ca")
    assert resolve_checkout_origin(None) == "https://dishbar.ca"
    try:
        resolve_checkout_origin("https://evil.example")
    except HTTPException as exc:
        assert exc.status_code == 400
    else:
        raise AssertionError("unlisted host was accepted")
