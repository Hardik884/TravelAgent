from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import uvicorn
from bson import ObjectId
from datetime import datetime

from config import settings
import logging
from models.schemas import (
    TripRequest, BudgetResponse,
    HotelSearchRequest, HotelSearchResponse,
    TransportSearchRequest, TransportSearchResponse,
    ItineraryRequest, ItineraryResponse,
    SaveTripRequest, UpdateTripRequest, SavedTrip, TripListResponse
)
from agents.budget_agent import budget_agent
from agents.budget_agent_v2 import enhanced_budget_agent
from agents.coordinator import agent_coordinator
from agents.hotel_agent import hotel_agent
from agents.transport_agent import transport_agent
from agents.activities_agent import activities_agent
from db import connect_to_mongo, close_mongo_connection, get_trips_collection

# Initialize FastAPI app
app = FastAPI(
    title="Travel Agent AI API",
    description="AI-powered travel planning with multi-agent system",
    version="1.0.0"
)

# Module logger
logger = logging.getLogger(__name__)

# Startup and shutdown events
@app.on_event("startup")
async def startup_db_client():
    """Connect to MongoDB on startup"""
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close MongoDB connection on shutdown"""
    await close_mongo_connection()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "message": "Travel Agent AI API is running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "agents": {
            "budget": "active",
            "hotel": "active",
            "transport": "active",
            "activities": "active"
        }
    }


@app.post("/api/budget/analyze", response_model=BudgetResponse)
async def analyze_budget(trip_request: TripRequest):
    """
    Analyze trip budget and provide intelligent allocation
    Uses Enhanced Budget Agent with Pipeline Support
    """
    try:
        # Use enhanced budget agent with pipeline
        result = agent_coordinator.process_budget(trip_request)
        return result["budget_response"]
    except Exception as e:
        logger.exception("Budget analysis error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Budget analysis failed: {str(e)}")


@app.post("/api/hotels/search", response_model=HotelSearchResponse)
async def search_hotels(request: HotelSearchRequest):
    """
    Search for hotels based on criteria
    Uses Pipeline to respect budget constraints
    """
    try:
        result = agent_coordinator.search_hotels(request)
        return result
    except Exception as e:
        logger.exception("Hotel search error: %s", str(e))
        # Fallback to regular search if pipeline not initialized
        result = hotel_agent.search_hotels(request)
        return result


@app.post("/api/transport/search", response_model=TransportSearchResponse)
async def search_transport(request: TransportSearchRequest):
    """
    Search for transport options (flights, trains, buses, cabs)
    Uses Pipeline to respect budget constraints
    """
    try:
        result = agent_coordinator.search_transport(request)
        return result
    except Exception as e:
        logger.exception("Transport search error: %s", str(e))
        # Fallback to regular search if pipeline not initialized
        result = transport_agent.search_transport(request)
        return result


@app.post("/api/itinerary/generate", response_model=ItineraryResponse)
async def generate_itinerary(request: ItineraryRequest):
    """
    Generate day-by-day itinerary with activities
    Uses Pipeline to respect budget constraints
    """
    try:
        result = agent_coordinator.generate_itinerary(request)
        return result
    except Exception as e:
        logger.exception("Itinerary generation error: %s", str(e))
        # Fallback to regular generation if pipeline not initialized
        result = activities_agent.generate_itinerary(request)
        return result


@app.post("/api/trip/complete")
async def complete_trip_plan(trip_data: Dict[Any, Any]):
    """
    Complete trip planning with all agents
    """
    try:
        # This endpoint can coordinate all agents for a complete flow
        return {
            "status": "success",
            "message": "Trip planning completed",
            "data": trip_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trip planning failed: {str(e)}")


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


# ============================================
# Trip History Endpoints (MongoDB)
# ============================================

@app.post("/api/trips", response_model=Dict[str, str])
async def save_trip(trip_request: SaveTripRequest):
    """
    Save a complete trip plan to history
    """
    try:
        collection = await get_trips_collection()
        
        # Prepare trip document
        trip_doc = {
            "user_id": trip_request.user_id,
            "trip": trip_request.trip.model_dump(),
            "budget": trip_request.budget.model_dump(),
            "hotel": trip_request.hotel.model_dump() if trip_request.hotel else None,
            "transport": trip_request.transport.model_dump() if trip_request.transport else None,
            "itinerary": trip_request.itinerary.model_dump() if trip_request.itinerary else None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await collection.insert_one(trip_doc)
        
        return {
            "id": str(result.inserted_id),
            "message": "Trip saved successfully"
        }
    except Exception as e:
        import traceback
        logger.exception("Error saving trip: %s", str(e))
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to save trip: {str(e)}")


@app.get("/api/trips", response_model=TripListResponse)
async def get_trips(
    user_id: str = Query(..., description="User ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Items per page")
):
    """
    Get list of saved trips for a user
    """
    try:
        collection = await get_trips_collection()
        
        skip = (page - 1) * limit
        
        # Query trips for user
        cursor = collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        trips_list = await cursor.to_list(length=limit)
        
        # Get total count
        total = await collection.count_documents({"user_id": user_id})
        
        # Process each trip
        processed_trips = []
        for trip in trips_list:
            # Convert ObjectId to string
            trip["id"] = str(trip.pop("_id"))
            
            # Convert datetime to ISO string
            if "created_at" in trip and isinstance(trip["created_at"], datetime):
                trip["created_at"] = trip["created_at"].isoformat()
            if "updated_at" in trip and isinstance(trip["updated_at"], datetime):
                trip["updated_at"] = trip["updated_at"].isoformat()
            processed_trips.append(trip)
        
        # Convert to SavedTrip models
        saved_trips = [SavedTrip(**trip) for trip in processed_trips]
        
        return TripListResponse(
            trips=saved_trips,
            total=total,
            page=page,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trips: {str(e)}")


@app.get("/api/trips/{trip_id}", response_model=SavedTrip)
async def get_trip(trip_id: str):
    """
    Get a single trip by ID
    """
    try:
        from bson import ObjectId
        collection = await get_trips_collection()
        
        trip = await collection.find_one({"_id": ObjectId(trip_id)})
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        # Convert ObjectId to string
        trip["id"] = str(trip.pop("_id"))
        
        # Convert datetime to ISO string
        if "created_at" in trip and isinstance(trip["created_at"], datetime):
            trip["created_at"] = trip["created_at"].isoformat()
        if "updated_at" in trip and isinstance(trip["updated_at"], datetime):
            trip["updated_at"] = trip["updated_at"].isoformat()
        
        return SavedTrip(**trip)
    except Exception as e:
        if "Trip not found" in str(e):
            raise
        raise HTTPException(status_code=500, detail=f"Failed to fetch trip: {str(e)}")


@app.put("/api/trips/{trip_id}", response_model=SavedTrip)
async def update_trip(trip_id: str, update_request: UpdateTripRequest):
    """
    Update a saved trip by ID (partial update supported)
    """
    try:
        from bson import ObjectId
        collection = await get_trips_collection()
        
        # Check if trip exists
        existing_trip = await collection.find_one({"_id": ObjectId(trip_id)})
        if not existing_trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        # Build update document with only provided fields
        update_doc = {}
        
        if update_request.trip is not None:
            update_doc["trip"] = update_request.trip.model_dump()
        
        if update_request.budget is not None:
            update_doc["budget"] = update_request.budget.model_dump()
        
        if update_request.hotel is not None:
            update_doc["hotel"] = update_request.hotel.model_dump()
        
        if update_request.transport is not None:
            update_doc["transport"] = update_request.transport.model_dump()
        
        if update_request.itinerary is not None:
            update_doc["itinerary"] = update_request.itinerary.model_dump()
        
        # Always update the updated_at timestamp
        update_doc["updated_at"] = datetime.utcnow()
        
        # Perform update
        result = await collection.update_one(
            {"_id": ObjectId(trip_id)},
            {"$set": update_doc}
        )
        
        if result.modified_count == 0 and not update_doc:
            # No changes were made
            pass
        
        # Fetch and return updated trip
        updated_trip = await collection.find_one({"_id": ObjectId(trip_id)})
        
        # Convert ObjectId to string
        updated_trip["id"] = str(updated_trip.pop("_id"))
        
        # Convert datetime to ISO string
        if "created_at" in updated_trip and isinstance(updated_trip["created_at"], datetime):
            updated_trip["created_at"] = updated_trip["created_at"].isoformat()
        if "updated_at" in updated_trip and isinstance(updated_trip["updated_at"], datetime):
            updated_trip["updated_at"] = updated_trip["updated_at"].isoformat()
        
        return SavedTrip(**updated_trip)
    except Exception as e:
        if "Trip not found" in str(e):
            raise
        raise HTTPException(status_code=500, detail=f"Failed to update trip: {str(e)}")


@app.delete("/api/trips/{trip_id}")
async def delete_trip(trip_id: str):
    """
    Delete a trip by ID
    """
    try:
        from bson import ObjectId
        collection = await get_trips_collection()
        
        result = await collection.delete_one({"_id": ObjectId(trip_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        return {"message": "Trip deleted successfully"}
    except Exception as e:
        if "Trip not found" in str(e):
            raise
        raise HTTPException(status_code=500, detail=f"Failed to delete trip: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
