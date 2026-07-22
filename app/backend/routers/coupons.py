import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.coupons import CouponsService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/coupons", tags=["coupons"])


# ---------- Pydantic Schemas ----------
class CouponsData(BaseModel):
    """Entity data schema (for create/update)"""
    code: str
    discount_percent: float = None
    discount_amount: float = None
    min_order_amount: float = None
    max_uses: int = None
    used_count: int = None
    is_active: bool = None
    expires_at: Optional[date] = None
    chef_id: int = None


class CouponsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    code: Optional[str] = None
    discount_percent: Optional[float] = None
    discount_amount: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_uses: Optional[int] = None
    used_count: Optional[int] = None
    is_active: Optional[bool] = None
    expires_at: Optional[date] = None
    chef_id: Optional[int] = None


class CouponsResponse(BaseModel):
    """Entity response schema"""
    id: int
    code: str
    discount_percent: Optional[float] = None
    discount_amount: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_uses: Optional[int] = None
    used_count: Optional[int] = None
    is_active: Optional[bool] = None
    expires_at: Optional[date] = None
    chef_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CouponsListResponse(BaseModel):
    """List response schema"""
    items: List[CouponsResponse]
    total: int
    skip: int
    limit: int


class CouponsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[CouponsData]


class CouponsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: CouponsUpdateData


class CouponsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[CouponsBatchUpdateItem]


class CouponsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=CouponsListResponse)
async def query_couponss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query couponss with filtering, sorting, and pagination"""
    logger.debug(f"Querying couponss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = CouponsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
        )
        logger.debug(f"Found {result['total']} couponss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid coupons query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying couponss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=CouponsListResponse)
async def query_couponss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query couponss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying couponss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = CouponsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} couponss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid coupons query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying couponss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=CouponsResponse)
async def get_coupons(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single coupons by ID"""
    logger.debug(f"Fetching coupons with id: {id}, fields={fields}")
    
    service = CouponsService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Coupons with id {id} not found")
            raise HTTPException(status_code=404, detail="Coupons not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching coupons {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=CouponsResponse, status_code=201)
async def create_coupons(
    data: CouponsData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new coupons"""
    logger.debug(f"Creating new coupons with data: {data}")
    
    service = CouponsService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create coupons")
        
        logger.info(f"Coupons created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating coupons: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating coupons: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[CouponsResponse], status_code=201)
async def create_couponss_batch(
    request: CouponsBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple couponss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} couponss")
    
    service = CouponsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} couponss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[CouponsResponse])
async def update_couponss_batch(
    request: CouponsBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple couponss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} couponss")
    
    service = CouponsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} couponss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=CouponsResponse)
async def update_coupons(
    id: int,
    data: CouponsUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing coupons"""
    logger.debug(f"Updating coupons {id} with data: {data}")

    service = CouponsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Coupons with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Coupons not found")
        
        logger.info(f"Coupons {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating coupons {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating coupons {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_couponss_batch(
    request: CouponsBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple couponss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} couponss")
    
    service = CouponsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} couponss successfully")
        return {"message": f"Successfully deleted {deleted_count} couponss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_coupons(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single coupons by ID"""
    logger.debug(f"Deleting coupons with id: {id}")
    
    service = CouponsService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Coupons with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Coupons not found")
        
        logger.info(f"Coupons {id} deleted successfully")
        return {"message": "Coupons deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting coupons {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")