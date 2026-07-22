import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.favourites import FavouritesService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/favourites", tags=["favourites"])


# ---------- Pydantic Schemas ----------
class FavouritesData(BaseModel):
    """Entity data schema (for create/update)"""
    chef_id: int
    menu_item_id: int = None


class FavouritesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    chef_id: Optional[int] = None
    menu_item_id: Optional[int] = None


class FavouritesResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    chef_id: int
    menu_item_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FavouritesListResponse(BaseModel):
    """List response schema"""
    items: List[FavouritesResponse]
    total: int
    skip: int
    limit: int


class FavouritesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[FavouritesData]


class FavouritesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: FavouritesUpdateData


class FavouritesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[FavouritesBatchUpdateItem]


class FavouritesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=FavouritesListResponse)
async def query_favouritess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query favouritess with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying favouritess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = FavouritesService(db)
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
        logger.debug(f"Found {result['total']} favouritess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid favourites query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying favouritess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=FavouritesListResponse)
async def query_favouritess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query favouritess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying favouritess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = FavouritesService(db)
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
        logger.debug(f"Found {result['total']} favouritess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid favourites query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying favouritess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=FavouritesResponse)
async def get_favourites(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single favourites by ID (user can only see their own records)"""
    logger.debug(f"Fetching favourites with id: {id}, fields={fields}")
    
    service = FavouritesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Favourites with id {id} not found")
            raise HTTPException(status_code=404, detail="Favourites not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching favourites {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=FavouritesResponse, status_code=201)
async def create_favourites(
    data: FavouritesData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new favourites"""
    logger.debug(f"Creating new favourites with data: {data}")
    
    service = FavouritesService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create favourites")
        
        logger.info(f"Favourites created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating favourites: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating favourites: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[FavouritesResponse], status_code=201)
async def create_favouritess_batch(
    request: FavouritesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple favouritess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} favouritess")
    
    service = FavouritesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} favouritess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[FavouritesResponse])
async def update_favouritess_batch(
    request: FavouritesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple favouritess in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} favouritess")
    
    service = FavouritesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} favouritess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=FavouritesResponse)
async def update_favourites(
    id: int,
    data: FavouritesUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing favourites (requires ownership)"""
    logger.debug(f"Updating favourites {id} with data: {data}")

    service = FavouritesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Favourites with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Favourites not found")
        
        logger.info(f"Favourites {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating favourites {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating favourites {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_favouritess_batch(
    request: FavouritesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple favouritess by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} favouritess")
    
    service = FavouritesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} favouritess successfully")
        return {"message": f"Successfully deleted {deleted_count} favouritess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_favourites(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single favourites by ID (requires ownership)"""
    logger.debug(f"Deleting favourites with id: {id}")
    
    service = FavouritesService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Favourites with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Favourites not found")
        
        logger.info(f"Favourites {id} deleted successfully")
        return {"message": "Favourites deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting favourites {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")