from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any
import uvicorn

from config import settings
from models.schemas import (
    TripRequest, BudgetResponse,
    HotelSearchRequest, HotelSearchResponse,
    TransportSearchRequest, TransportSearchResponse,
    ItineraryRequest, ItineraryResponse
)
from agents.budget_agent import budget_agent
from agents.hotel_agent import hotel_agent
from agents.transport_agent import transport_agent
from agents.activities_agent import activities_agent

# Initialize FastAPI app
app = FastAPI(
    title="Travel Agent AI API",
    description="AI-powered travel planning with multi-agent system",
    version="1.0.0"
)

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
    Agent 1: Budget Division Agent
    """
    try:
        result = budget_agent.allocate_budget(trip_request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Budget analysis failed: {str(e)}")


@app.post("/api/hotels/search", response_model=HotelSearchResponse)
async def search_hotels(request: HotelSearchRequest):
    """
    Search for hotels based on criteria
    Agent 2: Hotel Search Agent
    """
    try:
        result = hotel_agent.search_hotels(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hotel search failed: {str(e)}")


@app.post("/api/transport/search", response_model=TransportSearchResponse)
async def search_transport(request: TransportSearchRequest):
    """
    Search for transport options (flights, trains, buses, cabs)
    Agent 3: Transport Agent
    """
    try:
        result = transport_agent.search_transport(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transport search failed: {str(e)}")


@app.post("/api/itinerary/generate", response_model=ItineraryResponse)
async def generate_itinerary(request: ItineraryRequest):
    """
    Generate day-by-day itinerary with activities
    Agent 4: Activities Agent
    """
    try:
        result = activities_agent.generate_itinerary(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Itinerary generation failed: {str(e)}")


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


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
