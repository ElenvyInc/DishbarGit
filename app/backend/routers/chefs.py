import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.chefs import ChefsService
from dependencies.auth import get_current_user, get_admin_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/chefs", tags=["chefs"])


# ---------- Pydantic Schemas ----------
class ChefsData(BaseModel):
    """Entity data schema (for create/update)"""
    name: str
    name_fa: str = None
    bio: str = None
    bio_fa: str = None
    avatar_url: str = None
    city: str = None
    province: str = None
    cuisine_tags: str = None
    rating: float = None
    total_reviews: int = None
    is_approved: bool = None
    is_active: bool = None
    delivery_options: str = None


class ChefsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    name: Optional[str] = None
    name_fa: Optional[str] = None
    bio: Optional[str] = None
    bio_fa: Optional[str] = None
    avatar_url: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    cuisine_tags: Optional[str] = None
    rating: Optional[float] = None
    total_reviews: Optional[int] = None
    is_approved: Optional[bool] = None
    is_active: Optional[bool] = None
    delivery_options: Optional[str] = None


class ChefsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
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
    is_approved: Optional[bool] = None
    is_active: Optional[bool] = None
    delivery_options: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChefsListResponse(BaseModel):
    """List response schema"""
    items: List[ChefsResponse]
    total: int
    skip: int
    limit: int


class ChefsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[ChefsData]


class ChefsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: ChefsUpdateData


class ChefsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[ChefsBatchUpdateItem]


class ChefsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=ChefsListResponse)
async def query_chefss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query chefss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying chefss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = ChefsService(db)
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
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} chefss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid chefs query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying chefss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=ChefsListResponse)
async def query_chefss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
     current_user: UserResponse = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    # Query chefss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying chefss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = ChefsService(db)
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
        logger.debug(f"Found {result['total']} chefss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid chefs query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying chefss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=ChefsResponse)
async def get_chefs(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single chefs by ID (user can only see their own records)"""
    logger.debug(f"Fetching chefs with id: {id}, fields={fields}")
    
    service = ChefsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Chefs with id {id} not found")
            raise HTTPException(status_code=404, detail="Chefs not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching chefs {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=ChefsResponse, status_code=201)
async def create_chefs(
    data: ChefsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new chefs"""
    logger.debug(f"Creating new chefs with data: {data}")
    
    service = ChefsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create chefs")
        
        logger.info(f"Chefs created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating chefs: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating chefs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[ChefsResponse], status_code=201)
async def create_chefss_batch(
    request: ChefsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple chefss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} chefss")
    
    service = ChefsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} chefss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[ChefsResponse])
async def update_chefss_batch(
    request: ChefsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple chefss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} chefss")
    
    service = ChefsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} chefss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=ChefsResponse)
async def update_chefs(
    id: int,
    data: ChefsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing chefs (requires ownership)"""
    logger.debug(f"Updating chefs {id} with data: {data}")

    service = ChefsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Chefs with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Chefs not found")
        
        logger.info(f"Chefs {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating chefs {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating chefs {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_chefss_batch(
    request: ChefsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple chefss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} chefss")
    
    service = ChefsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} chefss successfully")
        return {"message": f"Successfully deleted {deleted_count} chefss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_chefs(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single chefs by ID (requires ownership)"""
    logger.debug(f"Deleting chefs with id: {id}")
    
    service = ChefsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Chefs with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Chefs not found")
        
        logger.info(f"Chefs {id} deleted successfully")
        return {"message": "Chefs deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chefs {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")