"""Explicit access class for every HTTP route.

Classes: public, customer-auth, cook-owned, admin-only.
`apply_endpoint_access` stamps the class onto each route and refuses to boot
if a route is missing from this classification.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.routing import APIRoute

ACCESS_PUBLIC = "public"
ACCESS_CUSTOMER = "customer-auth"
ACCESS_COOK = "cook-owned"
ACCESS_ADMIN = "admin-only"
ACCESS_CLASSES = {ACCESS_PUBLIC, ACCESS_CUSTOMER, ACCESS_COOK, ACCESS_ADMIN}


def classify_endpoint(method: str, path: str) -> str:
    method = method.upper()

    if (method, path) == ("GET", "/api/v1/admin/settings/pilot-status"):
        return ACCESS_PUBLIC
    if path in {"/", "/health", "/database/health"}:
        return ACCESS_PUBLIC
    if path.startswith("/api/v1/public/"):
        return ACCESS_PUBLIC
    if path in {
        "/api/v1/auth/login",
        "/api/v1/auth/callback",
        "/api/v1/auth/logout",
        "/api/v1/auth/token/exchange",
    }:
        return ACCESS_PUBLIC
    if path == "/api/v1/auth/me":
        return ACCESS_CUSTOMER
    if path == "/api/v1/payment/webhook":
        return ACCESS_PUBLIC
    if path == "/api/v1/payment/quote":
        return ACCESS_PUBLIC
    if path.startswith("/api/v1/payment/"):
        return ACCESS_CUSTOMER
    if path.startswith("/api/v1/admin/"):
        return ACCESS_ADMIN
    if path.startswith("/api/v1/entities/platform_settings"):
        return ACCESS_ADMIN
    if path.startswith("/api/v1/entities/coupons"):
        return ACCESS_ADMIN
    if path.startswith("/api/v1/cook/"):
        return ACCESS_COOK
    if path.startswith("/api/v1/entities/") and path.endswith("/all"):
        return ACCESS_ADMIN
    if path.startswith("/api/v1/entities/chefs"):
        return ACCESS_COOK
    if path.startswith("/api/v1/entities/menu_items"):
        return ACCESS_COOK
    if path.startswith("/api/v1/entities/orders"):
        return ACCESS_CUSTOMER
    if path.startswith("/api/v1/entities/"):
        return ACCESS_CUSTOMER
    if path.startswith("/api/v1/aihub/"):
        return ACCESS_CUSTOMER
    if path.startswith("/api/v1/users"):
        return ACCESS_CUSTOMER
    if path.startswith("/api/v1/storage/"):
        if path.endswith("/create-bucket"):
            return ACCESS_ADMIN
        return ACCESS_CUSTOMER
    raise RuntimeError(f"No access class for {method} {path}")


def iter_api_routes(app: FastAPI):
    """Yield API routes, including routers nested by current FastAPI."""
    for route in app.routes:
        if isinstance(route, APIRoute):
            yield route
            continue
        contexts = getattr(route, "effective_route_contexts", None)
        if contexts is None:
            continue
        for ctx in contexts():
            original = getattr(ctx, "original_route", None)
            if isinstance(original, APIRoute):
                yield original


def apply_endpoint_access(app: FastAPI) -> dict[tuple[str, str], str]:
    classified: dict[tuple[str, str], str] = {}
    for route in iter_api_routes(app):
        methods = [method for method in sorted(route.methods or []) if method not in {"HEAD", "OPTIONS"}]
        access = None
        for method in methods:
            access = classify_endpoint(method, route.path)
            if access not in ACCESS_CLASSES:
                raise RuntimeError(f"Invalid access class {access} for {method} {route.path}")
            classified[(method, route.path)] = access
        if access is not None:
            route.endpoint.__access_class__ = access
    if not classified:
        raise RuntimeError("No HTTP routes were classified")
    return classified
