import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.messages import MessagesService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/messages", tags=["messages"])


# ---------- Pydantic Schemas ----------
class MessagesData(BaseModel):
    """Entity data schema (for create/update)"""
    sender_id: str
    receiver_id: str
    order_id: int = None
    content: str
    is_read: bool = None


class MessagesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    sender_id: Optional[str] = None
    receiver_id: Optional[str] = None
    order_id: Optional[int] = None
    content: Optional[str] = None
    is_read: Optional[bool] = None


class MessagesResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    sender_id: str
    receiver_id: str
    order_id: Optional[int] = None
    content: str
    is_read: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessagesListResponse(BaseModel):
    """List response schema"""
    items: List[MessagesResponse]
    total: int
    skip: int
    limit: int


class MessagesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[MessagesData]


class MessagesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: MessagesUpdateData


class MessagesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[MessagesBatchUpdateItem]


class MessagesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=MessagesListResponse)
async def query_messagess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query messagess with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying messagess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = MessagesService(db)
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
        logger.debug(f"Found {result['total']} messagess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid messages query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying messagess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=MessagesListResponse)
async def query_messagess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query messagess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying messagess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = MessagesService(db)
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
        logger.debug(f"Found {result['total']} messagess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid messages query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying messagess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=MessagesResponse)
async def get_messages(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single messages by ID (user can only see their own records)"""
    logger.debug(f"Fetching messages with id: {id}, fields={fields}")
    
    service = MessagesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Messages with id {id} not found")
            raise HTTPException(status_code=404, detail="Messages not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=MessagesResponse, status_code=201)
async def create_messages(
    data: MessagesData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new messages"""
    logger.debug(f"Creating new messages with data: {data}")
    
    service = MessagesService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create messages")
        
        logger.info(f"Messages created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating messages: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating messages: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[MessagesResponse], status_code=201)
async def create_messagess_batch(
    request: MessagesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple messagess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} messagess")
    
    service = MessagesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} messagess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[MessagesResponse])
async def update_messagess_batch(
    request: MessagesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple messagess in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} messagess")
    
    service = MessagesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} messagess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=MessagesResponse)
async def update_messages(
    id: int,
    data: MessagesUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing messages (requires ownership)"""
    logger.debug(f"Updating messages {id} with data: {data}")

    service = MessagesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Messages with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Messages not found")
        
        logger.info(f"Messages {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating messages {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating messages {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_messagess_batch(
    request: MessagesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple messagess by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} messagess")
    
    service = MessagesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} messagess successfully")
        return {"message": f"Successfully deleted {deleted_count} messagess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_messages(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single messages by ID (requires ownership)"""
    logger.debug(f"Deleting messages with id: {id}")
    
    service = MessagesService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Messages with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Messages not found")
        
        logger.info(f"Messages {id} deleted successfully")
        return {"message": "Messages deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting messages {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")