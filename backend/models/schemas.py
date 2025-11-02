from pydantic import BaseModel, Field
from typing import List, Optional, Union
from datetime import date, datetime


class TripRequest(BaseModel):
    trip_type: str = Field(..., description="Type of trip: luxurious, adventurous, family, budget, cultural")
    origin: str = Field(..., description="Origin city - where user is traveling from")
    destination: str = Field(..., description="Destination city or location")
    start_date: Union[date, str] = Field(..., description="Trip start date")
    end_date: Union[date, str] = Field(..., description="Trip end date")
    budget: float = Field(..., gt=0, description="Total budget in INR")
    adults: int = Field(default=2, ge=1, description="Number of adults")
    children: int = Field(default=0, ge=0, description="Number of children")


class BudgetBreakdown(BaseModel):
    name: str
    value: float
    percentage: float


class BudgetResponse(BaseModel):
    total: float
    breakdown: List[BudgetBreakdown]
    recommendations: str


class HotelSearchRequest(BaseModel):
    destination: str
    check_in: date
    check_out: date
    adults: int = 2
    children: int = 0
    max_price: float
    trip_type: str


class Hotel(BaseModel):
    id: str
    name: str
    price: float
    rating: float
    image: str
    location: str
    amenities: List[str]
    description: str
    tag: str


class HotelSearchResponse(BaseModel):
    hotels: List[Hotel]
    total_count: int


class TransportOption(BaseModel):
    carrier: str
    time: str
    price: float
    duration: str
    class_type: Optional[str] = None


class TransportMode(BaseModel):
    mode: str
    icon: str
    duration: str
    price_range: str
    note: str
    options: List[TransportOption]


class TransportSearchRequest(BaseModel):
    origin: str
    destination: str
    travel_date: date
    adults: int = 2
    children: int = 0
    budget_allocation: float


class TransportSearchResponse(BaseModel):
    transport_modes: List[TransportMode]


class Activity(BaseModel):
    name: str
    icon: str
    time: str
    cost: float
    description: str


class DayPlan(BaseModel):
    day: int
    date: str
    activities: List[Activity]
    total_cost: float


class ItineraryRequest(BaseModel):
    destination: str
    start_date: date
    end_date: date
    trip_type: str
    budget_allocation: float
    interests: Optional[List[str]] = None


class ItineraryResponse(BaseModel):
    itinerary: List[DayPlan]
    total_activities_cost: float
    recommendations: str


class TripSummary(BaseModel):
    trip_details: TripRequest
    budget: BudgetResponse
    hotel: Optional[Hotel] = None
    transport: Optional[TransportMode] = None
    itinerary: Optional[ItineraryResponse] = None
    total_estimated_cost: float


# Trip History models for MongoDB
class SavedTrip(BaseModel):
    id: Optional[str] = Field(None, description="Trip ID")
    user_id: str = Field(..., description="User identifier")
    trip: TripRequest
    budget: BudgetResponse
    hotel: Optional[Hotel] = None
    transport: Optional[TransportMode] = None
    itinerary: Optional[ItineraryResponse] = None
    created_at: Union[datetime, str] = Field(default_factory=datetime.utcnow)
    updated_at: Union[datetime, str] = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SaveTripRequest(BaseModel):
    user_id: str
    trip: TripRequest
    budget: BudgetResponse
    hotel: Optional[Hotel] = None
    transport: Optional[TransportMode] = None
    itinerary: Optional[ItineraryResponse] = None


class UpdateTripRequest(BaseModel):
    trip: Optional[TripRequest] = None
    budget: Optional[BudgetResponse] = None
    hotel: Optional[Hotel] = None
    transport: Optional[TransportMode] = None
    itinerary: Optional[ItineraryResponse] = None


class TripListResponse(BaseModel):
    trips: List[SavedTrip]
    total: int
    page: int
    limit: int

