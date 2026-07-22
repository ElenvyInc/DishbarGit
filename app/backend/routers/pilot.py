"""
Pilot Mode & Platform Settings API
Provides admin controls for pilot operations, platform configuration,
and operational settings required for a private pilot launch.
"""
import json
import logging
from typing import Optional, List
from datetime import datetime, date, time

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from models.platform_settings import Platform_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin/settings", tags=["admin-settings"])

# Default pilot settings
DEFAULT_SETTINGS = {
    "pilot_mode": {"value": "true", "description": "Whether platform is in pilot mode"},
    "platform_open": {"value": "true", "description": "Whether platform is accepting orders"},
    "pilot_message_en": {"value": "DishBar is currently operating as a limited pilot in select Ontario areas.", "description": "Pilot notice for customers (English)"},
    "pilot_message_fa": {"value": "دیش‌بار در حال حاضر به صورت آزمایشی در مناطق منتخب انتاریو فعالیت می‌کند.", "description": "Pilot notice for customers (Persian)"},
    "pilot_message_fr": {"value": "DishBar fonctionne actuellement en mode pilote limité dans certaines zones de l'Ontario.", "description": "Pilot notice for customers (French)"},
    "pilot_postal_codes": {"value": "[]", "description": "JSON array of allowed postal code prefixes (e.g. [\"M5\", \"M4\", \"L5\"])"},
    "ordering_days": {"value": "[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\",\"saturday\",\"sunday\"]", "description": "Days when ordering is allowed"},
    "ordering_hours_start": {"value": "09:00", "description": "Ordering start time (HH:MM)"},
    "ordering_hours_end": {"value": "20:00", "description": "Ordering end time (HH:MM)"},
    "daily_order_limit": {"value": "20", "description": "Maximum orders per day (0 = unlimited)"},
    "minimum_order_amount": {"value": "15.00", "description": "Minimum order amount in CAD"},
    "max_delivery_radius_km": {"value": "25", "description": "Maximum delivery radius in km"},
    "base_delivery_fee": {"value": "3.99", "description": "Base delivery fee in CAD"},
    "included_distance_km": {"value": "5", "description": "Distance included in base fee (km)"},
    "per_km_fee": {"value": "1.50", "description": "Fee per km beyond included distance"},
    "max_delivery_fee": {"value": "15.00", "description": "Maximum delivery fee cap in CAD"},
    "free_pickup": {"value": "true", "description": "Whether pickup is free"},
    "platform_commission_rate": {"value": "0.15", "description": "Platform commission rate (0.15 = 15%)"},
    "tax_rate": {"value": "0.13", "description": "HST rate for Ontario"},
    "cancellation_deadline_minutes": {"value": "30", "description": "Minutes after order when cancellation is still allowed"},
    "order_cutoff_hours_before": {"value": "2", "description": "Hours before available_date when ordering closes"},
    "chef_preparation_time_minutes": {"value": "60", "description": "Default chef preparation time in minutes"},
    "support_email": {"value": "support@dishbar.ca", "description": "Support email address"},
    "support_phone": {"value": "+1-647-000-0000", "description": "Support phone number"},
    "terms_url": {"value": "/legal/terms", "description": "Terms of Service URL"},
    "privacy_url": {"value": "/legal/privacy", "description": "Privacy Policy URL"},
    "refund_policy_url": {"value": "/legal/refund", "description": "Refund Policy URL"},
    "manual_payouts": {"value": "true", "description": "Whether chef payouts are manual (pilot mode)"},
}


class SettingResponse(BaseModel):
    id: int
    key: str
    value: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class SettingUpdateRequest(BaseModel):
    key: str
    value: str


class SettingsBulkUpdateRequest(BaseModel):
    settings: List[SettingUpdateRequest]


class PilotStatusResponse(BaseModel):
    pilot_mode: bool
    platform_open: bool
    pilot_message_en: str
    pilot_message_fa: str
    pilot_message_fr: str
    pilot_postal_codes: List[str]
    ordering_days: List[str]
    ordering_hours_start: str
    ordering_hours_end: str
    daily_order_limit: int
    minimum_order_amount: float
    max_delivery_radius_km: float
    base_delivery_fee: float
    per_km_fee: float
    max_delivery_fee: float
    free_pickup: bool
    platform_commission_rate: float
    tax_rate: float
    support_email: str
    support_phone: str
    manual_payouts: bool


@router.get("/all")
async def get_all_settings(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all platform settings (admin only)"""
    try:
        result = await db.execute(select(Platform_settings).order_by(Platform_settings.key))
        settings = result.scalars().all()

        # If no settings exist, initialize defaults
        if not settings:
            await _initialize_defaults(db)
            result = await db.execute(select(Platform_settings).order_by(Platform_settings.key))
            settings = result.scalars().all()

        return {
            "items": [
                {"id": s.id, "key": s.key, "value": s.value, "description": s.description}
                for s in settings
            ]
        }
    except Exception as e:
        logger.error(f"Error getting settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update")
async def update_setting(
    data: SettingUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a single platform setting"""
    try:
        result = await db.execute(
            select(Platform_settings).where(Platform_settings.key == data.key)
        )
        setting = result.scalar_one_or_none()

        if setting:
            setting.value = data.value
        else:
            setting = Platform_settings(
                key=data.key,
                value=data.value,
                description=DEFAULT_SETTINGS.get(data.key, {}).get("description", ""),
            )
            db.add(setting)

        await db.commit()
        return {"message": f"Setting '{data.key}' updated", "key": data.key, "value": data.value}
    except Exception as e:
        logger.error(f"Error updating setting: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk-update")
async def bulk_update_settings(
    data: SettingsBulkUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple platform settings at once"""
    try:
        for item in data.settings:
            result = await db.execute(
                select(Platform_settings).where(Platform_settings.key == item.key)
            )
            setting = result.scalar_one_or_none()
            if setting:
                setting.value = item.value
            else:
                setting = Platform_settings(
                    key=item.key,
                    value=item.value,
                    description=DEFAULT_SETTINGS.get(item.key, {}).get("description", ""),
                )
                db.add(setting)

        await db.commit()
        return {"message": f"Updated {len(data.settings)} settings"}
    except Exception as e:
        logger.error(f"Error bulk updating settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/initialize")
async def initialize_settings(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initialize all default settings (only adds missing ones)"""
    try:
        count = await _initialize_defaults(db)
        return {"message": f"Initialized {count} settings"}
    except Exception as e:
        logger.error(f"Error initializing settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pause-ordering")
async def pause_ordering(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Emergency: pause all ordering immediately"""
    try:
        result = await db.execute(
            select(Platform_settings).where(Platform_settings.key == "platform_open")
        )
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = "false"
        else:
            db.add(Platform_settings(key="platform_open", value="false", description="Whether platform is accepting orders"))
        await db.commit()
        return {"message": "Ordering paused", "platform_open": False}
    except Exception as e:
        logger.error(f"Error pausing ordering: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resume-ordering")
async def resume_ordering(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resume ordering after pause"""
    try:
        result = await db.execute(
            select(Platform_settings).where(Platform_settings.key == "platform_open")
        )
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = "true"
        else:
            db.add(Platform_settings(key="platform_open", value="true", description="Whether platform is accepting orders"))
        await db.commit()
        return {"message": "Ordering resumed", "platform_open": True}
    except Exception as e:
        logger.error(f"Error resuming ordering: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ---- Public endpoint for pilot status (no auth) ----
@router.get("/pilot-status")
async def get_pilot_status(
    db: AsyncSession = Depends(get_db),
):
    """Get public pilot status information (no auth required)"""
    try:
        result = await db.execute(select(Platform_settings))
        all_settings = result.scalars().all()
        settings_map = {s.key: s.value for s in all_settings}

        # If no settings, return defaults
        if not settings_map:
            settings_map = {k: v["value"] for k, v in DEFAULT_SETTINGS.items()}

        def get_bool(key: str) -> bool:
            return settings_map.get(key, DEFAULT_SETTINGS.get(key, {}).get("value", "false")).lower() == "true"

        def get_float(key: str) -> float:
            try:
                return float(settings_map.get(key, DEFAULT_SETTINGS.get(key, {}).get("value", "0")))
            except (ValueError, TypeError):
                return 0.0

        def get_int(key: str) -> int:
            try:
                return int(float(settings_map.get(key, DEFAULT_SETTINGS.get(key, {}).get("value", "0"))))
            except (ValueError, TypeError):
                return 0

        def get_str(key: str) -> str:
            return settings_map.get(key, DEFAULT_SETTINGS.get(key, {}).get("value", ""))

        def get_json_list(key: str) -> list:
            try:
                return json.loads(get_str(key))
            except (json.JSONDecodeError, TypeError):
                return []

        return PilotStatusResponse(
            pilot_mode=get_bool("pilot_mode"),
            platform_open=get_bool("platform_open"),
            pilot_message_en=get_str("pilot_message_en"),
            pilot_message_fa=get_str("pilot_message_fa"),
            pilot_message_fr=get_str("pilot_message_fr"),
            pilot_postal_codes=get_json_list("pilot_postal_codes"),
            ordering_days=get_json_list("ordering_days"),
            ordering_hours_start=get_str("ordering_hours_start"),
            ordering_hours_end=get_str("ordering_hours_end"),
            daily_order_limit=get_int("daily_order_limit"),
            minimum_order_amount=get_float("minimum_order_amount"),
            max_delivery_radius_km=get_float("max_delivery_radius_km"),
            base_delivery_fee=get_float("base_delivery_fee"),
            per_km_fee=get_float("per_km_fee"),
            max_delivery_fee=get_float("max_delivery_fee"),
            free_pickup=get_bool("free_pickup"),
            platform_commission_rate=get_float("platform_commission_rate"),
            tax_rate=get_float("tax_rate"),
            support_email=get_str("support_email"),
            support_phone=get_str("support_phone"),
            manual_payouts=get_bool("manual_payouts"),
        )
    except Exception as e:
        logger.error(f"Error getting pilot status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def _initialize_defaults(db: AsyncSession) -> int:
    """Initialize default settings, only adding missing ones"""
    count = 0
    for key, config in DEFAULT_SETTINGS.items():
        result = await db.execute(
            select(Platform_settings).where(Platform_settings.key == key)
        )
        existing = result.scalar_one_or_none()
        if not existing:
            db.add(Platform_settings(
                key=key,
                value=config["value"],
                description=config["description"],
            ))
            count += 1
    await db.commit()
    return count