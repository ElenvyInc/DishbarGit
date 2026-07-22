import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.reviews import ReviewsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/reviews", tags=["reviews"])


# ---------- Pydantic Schemas ----------
class ReviewsData(BaseModel):
    """Entity data schema (for create/update)"""
    chef_id: int
    order_id: int = None
    rating: int
    comment: str = None
    comment_fa: str = None


class ReviewsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    chef_id: Optional[int] = None
    order_id: Optional[int] = None
    rating: Optional[int] = None
    comment: Optional[str] = None
    comment_fa: Optional[str] = None


class ReviewsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    chef_id: int
    order_id: Optional[int] = None
    rating: int
    comment: Optional[str] = None
    comment_fa: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewsListResponse(BaseModel):
    """List response schema"""
    items: List[ReviewsResponse]
    total: int
    skip: int
    limit: int


class ReviewsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[ReviewsData]


class ReviewsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: ReviewsUpdateData


class ReviewsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[ReviewsBatchUpdateItem]


class ReviewsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=ReviewsListResponse)
async def query_reviewss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query reviewss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying reviewss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = ReviewsService(db)
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
        logger.debug(f"Found {result['total']} reviewss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid reviews query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying reviewss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=ReviewsListResponse)
async def query_reviewss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query reviewss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying reviewss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = ReviewsService(db)
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
        logger.debug(f"Found {result['total']} reviewss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid reviews query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying reviewss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=ReviewsResponse)
async def get_reviews(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single reviews by ID (user can only see their own records)"""
    logger.debug(f"Fetching reviews with id: {id}, fields={fields}")
    
    service = ReviewsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Reviews with id {id} not found")
            raise HTTPException(status_code=404, detail="Reviews not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching reviews {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=ReviewsResponse, status_code=201)
async def create_reviews(
    data: ReviewsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new reviews"""
    logger.debug(f"Creating new reviews with data: {data}")
    
    service = ReviewsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create reviews")
        
        logger.info(f"Reviews created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating reviews: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating reviews: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[ReviewsResponse], status_code=201)
async def create_reviewss_batch(
    request: ReviewsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple reviewss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} reviewss")
    
    service = ReviewsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} reviewss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[ReviewsResponse])
async def update_reviewss_batch(
    request: ReviewsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple reviewss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} reviewss")
    
    service = ReviewsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} reviewss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=ReviewsResponse)
async def update_reviews(
    id: int,
    data: ReviewsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing reviews (requires ownership)"""
    logger.debug(f"Updating reviews {id} with data: {data}")

    service = ReviewsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Reviews with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Reviews not found")
        
        logger.info(f"Reviews {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating reviews {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating reviews {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_reviewss_batch(
    request: ReviewsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple reviewss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} reviewss")
    
    service = ReviewsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} reviewss successfully")
        return {"message": f"Successfully deleted {deleted_count} reviewss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_reviews(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single reviews by ID (requires ownership)"""
    logger.debug(f"Deleting reviews with id: {id}")
    
    service = ReviewsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Reviews with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Reviews not found")
        
        logger.info(f"Reviews {id} deleted successfully")
        return {"message": "Reviews deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting reviews {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")