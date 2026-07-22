import json
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from core.database import get_db
from models.chefs import Chefs
from models.menu_items import Menu_items
from models.reviews import Reviews

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/public", tags=["public"])


# ---------- Response Schemas ----------
class PublicChefResponse(BaseModel):
    id: int
    name: str
    name_fa: Optional[str] = None
    bio: Optional[str] = None
    bio_fa: Optional[str] = None
    avatar_url: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    cuisine_tags: Optional[str] = None
    rating: Optional[float] = None
    total_reviews: Optional[int] = None
    delivery_options: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PublicMenuItemResponse(BaseModel):
    id: int
    chef_id: int
    title: str
    title_fa: Optional[str] = None
    description: Optional[str] = None
    description_fa: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    category: Optional[str] = None
    dietary_tags: Optional[str] = None
    is_available: Optional[bool] = None
    available_date: Optional[str] = None
    max_orders: Optional[int] = None
    chef_name: Optional[str] = None
    chef_name_fa: Optional[str] = None
    chef_avatar: Optional[str] = None
    chef_city: Optional[str] = None

    class Config:
        from_attributes = True


class PublicReviewResponse(BaseModel):
    id: int
    chef_id: int
    rating: int
    comment: Optional[str] = None
    comment_fa: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChefsListPublicResponse(BaseModel):
    items: List[PublicChefResponse]
    total: int


class MenuListPublicResponse(BaseModel):
    items: List[PublicMenuItemResponse]
    total: int


class ReviewsListPublicResponse(BaseModel):
    items: List[PublicReviewResponse]
    total: int


class ChefDetailResponse(BaseModel):
    chef: PublicChefResponse
    menu_items: List[PublicMenuItemResponse]
    reviews: List[PublicReviewResponse]


# ---------- Routes ----------
@router.get("/chefs", response_model=ChefsListPublicResponse)
async def list_public_chefs(
    city: Optional[str] = Query(None),
    cuisine: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all approved and active chefs - no auth required"""
    try:
        query = select(Chefs).where(
            and_(Chefs.is_approved == True, Chefs.is_active == True)
        )

        if city:
            query = query.where(Chefs.city.ilike(f"%{city}%"))
        if cuisine:
            query = query.where(Chefs.cuisine_tags.ilike(f"%{cuisine}%"))
        if search:
            query = query.where(
                or_(
                    Chefs.name.ilike(f"%{search}%"),
                    Chefs.name_fa.ilike(f"%{search}%"),
                    Chefs.bio.ilike(f"%{search}%"),
                    Chefs.cuisine_tags.ilike(f"%{search}%"),
                )
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(Chefs.rating.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        chefs = result.scalars().all()

        return ChefsListPublicResponse(
            items=[PublicChefResponse.model_validate(c) for c in chefs],
            total=total,
        )
    except Exception as e:
        logger.error(f"Error listing public chefs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chefs/{chef_id}", response_model=ChefDetailResponse)
async def get_public_chef(
    chef_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a chef's profile with menu items and reviews - no auth required"""
    try:
        # Get chef
        chef_result = await db.execute(
            select(Chefs).where(
                and_(Chefs.id == chef_id, Chefs.is_approved == True, Chefs.is_active == True)
            )
        )
        chef = chef_result.scalar_one_or_none()
        if not chef:
            raise HTTPException(status_code=404, detail="Chef not found")

        # Get menu items
        menu_result = await db.execute(
            select(Menu_items)
            .where(and_(Menu_items.chef_id == chef_id, Menu_items.is_available == True))
            .order_by(Menu_items.category)
        )
        menu_items = menu_result.scalars().all()

        # Get reviews
        reviews_result = await db.execute(
            select(Reviews)
            .where(Reviews.chef_id == chef_id)
            .order_by(Reviews.created_at.desc())
            .limit(20)
        )
        reviews = reviews_result.scalars().all()

        return ChefDetailResponse(
            chef=PublicChefResponse.model_validate(chef),
            menu_items=[
                PublicMenuItemResponse(
                    id=m.id,
                    chef_id=m.chef_id,
                    title=m.title,
                    title_fa=m.title_fa,
                    description=m.description,
                    description_fa=m.description_fa,
                    price=m.price,
                    image_url=m.image_url,
                    category=m.category,
                    dietary_tags=m.dietary_tags,
                    is_available=m.is_available,
                    available_date=str(m.available_date) if m.available_date else None,
                    max_orders=m.max_orders,
                )
                for m in menu_items
            ],
            reviews=[PublicReviewResponse.model_validate(r) for r in reviews],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting public chef: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/menu", response_model=MenuListPublicResponse)
async def search_public_menu(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    chef_id: Optional[int] = Query(None),
    dietary: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search/filter available menu items - no auth required"""
    try:
        query = (
            select(Menu_items, Chefs.name, Chefs.name_fa, Chefs.avatar_url, Chefs.city)
            .join(Chefs, Menu_items.chef_id == Chefs.id)
            .where(
                and_(
                    Menu_items.is_available == True,
                    Chefs.is_approved == True,
                    Chefs.is_active == True,
                )
            )
        )

        if category:
            query = query.where(Menu_items.category.ilike(f"%{category}%"))
        if search:
            query = query.where(
                or_(
                    Menu_items.title.ilike(f"%{search}%"),
                    Menu_items.title_fa.ilike(f"%{search}%"),
                    Menu_items.description.ilike(f"%{search}%"),
                )
            )
        if chef_id:
            query = query.where(Menu_items.chef_id == chef_id)
        if dietary:
            query = query.where(Menu_items.dietary_tags.ilike(f"%{dietary}%"))

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Get results
        query = query.order_by(Menu_items.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        rows = result.all()

        items = []
        for row in rows:
            menu_item = row[0]
            chef_name = row[1]
            chef_name_fa = row[2]
            chef_avatar = row[3]
            chef_city = row[4]
            items.append(
                PublicMenuItemResponse(
                    id=menu_item.id,
                    chef_id=menu_item.chef_id,
                    title=menu_item.title,
                    title_fa=menu_item.title_fa,
                    description=menu_item.description,
                    description_fa=menu_item.description_fa,
                    price=menu_item.price,
                    image_url=menu_item.image_url,
                    category=menu_item.category,
                    dietary_tags=menu_item.dietary_tags,
                    is_available=menu_item.is_available,
                    available_date=str(menu_item.available_date) if menu_item.available_date else None,
                    max_orders=menu_item.max_orders,
                    chef_name=chef_name,
                    chef_name_fa=chef_name_fa,
                    chef_avatar=chef_avatar,
                    chef_city=chef_city,
                )
            )

        return MenuListPublicResponse(items=items, total=total)
    except Exception as e:
        logger.error(f"Error searching public menu: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews/{chef_id}", response_model=ReviewsListPublicResponse)
async def get_public_reviews(
    chef_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get reviews for a specific chef - no auth required"""
    try:
        query = select(Reviews).where(Reviews.chef_id == chef_id)

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(Reviews.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        reviews = result.scalars().all()

        return ReviewsListPublicResponse(
            items=[PublicReviewResponse.model_validate(r) for r in reviews],
            total=total,
        )
    except Exception as e:
        logger.error(f"Error getting public reviews: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))