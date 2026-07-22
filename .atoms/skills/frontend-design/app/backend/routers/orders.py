import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.orders import OrdersService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/orders", tags=["orders"])


# ---------- Pydantic Schemas ----------
class OrdersData(BaseModel):
    """Entity data schema (for create/update)"""
    chef_id: int
    items_json: str = None
    total_amount: float
    commission_amount: float = None
    chef_amount: float = None
    status: str = None
    delivery_type: str = None
    delivery_address: str = None
    customer_name: str = None
    customer_phone: str = None
    stripe_session_id: str = None
    payment_status: str = None


class OrdersUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    chef_id: Optional[int] = None
    items_json: Optional[str] = None
    total_amount: Optional[float] = None
    commission_amount: Optional[float] = None
    chef_amount: Optional[float] = None
    status: Optional[str] = None
    delivery_type: Optional[str] = None
    delivery_address: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    stripe_session_id: Optional[str] = None
    payment_status: Optional[str] = None


class OrdersResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    chef_id: int
    items_json: Optional[str] = None
    total_amount: float
    commission_amount: Optional[float] = None
    chef_amount: Optional[float] = None
    status: Optional[str] = None
    delivery_type: Optional[str] = None
    delivery_address: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    stripe_session_id: Optional[str] = None
    payment_status: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrdersListResponse(BaseModel):
    """List response schema"""
    items: List[OrdersResponse]
    total: int
    skip: int
    limit: int


class OrdersBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[OrdersData]


class OrdersBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: OrdersUpdateData


class OrdersBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[OrdersBatchUpdateItem]


class OrdersBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=OrdersListResponse)
async def query_orderss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query orderss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying orderss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = OrdersService(db)
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
        logger.debug(f"Found {result['total']} orderss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid orders query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying orderss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=OrdersListResponse)
async def query_orderss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query orderss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying orderss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = OrdersService(db)
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
        logger.debug(f"Found {result['total']} orderss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid orders query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying orderss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=OrdersResponse)
async def get_orders(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single orders by ID (user can only see their own records)"""
    logger.debug(f"Fetching orders with id: {id}, fields={fields}")
    
    service = OrdersService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Orders with id {id} not found")
            raise HTTPException(status_code=404, detail="Orders not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching orders {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=OrdersResponse, status_code=201)
async def create_orders(
    data: OrdersData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new orders"""
    logger.debug(f"Creating new orders with data: {data}")
    
    service = OrdersService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create orders")
        
        logger.info(f"Orders created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating orders: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating orders: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[OrdersResponse], status_code=201)
async def create_orderss_batch(
    request: OrdersBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple orderss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} orderss")
    
    service = OrdersService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} orderss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[OrdersResponse])
async def update_orderss_batch(
    request: OrdersBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple orderss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} orderss")
    
    service = OrdersService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} orderss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=OrdersResponse)
async def update_orders(
    id: int,
    data: OrdersUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing orders (requires ownership)"""
    logger.debug(f"Updating orders {id} with data: {data}")

    service = OrdersService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Orders with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Orders not found")
        
        logger.info(f"Orders {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating orders {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating orders {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_orderss_batch(
    request: OrdersBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple orderss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} orderss")
    
    service = OrdersService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} orderss successfully")
        return {"message": f"Successfully deleted {deleted_count} orderss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_orders(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single orders by ID (requires ownership)"""
    logger.debug(f"Deleting orders with id: {id}")
    
    service = OrdersService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Orders with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Orders not found")
        
        logger.info(f"Orders {id} deleted successfully")
        return {"message": "Orders deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting orders {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")