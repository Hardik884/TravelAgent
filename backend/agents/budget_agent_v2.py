from typing import Dict, List
from models.schemas import TripRequest, BudgetResponse, BudgetBreakdown
from config import settings
from datetime import datetime, date
import logging

# Module logger
logger = logging.getLogger(__name__)


class EnhancedBudgetAgent:
    """
    Enhanced Budget Agent that provides detailed budget breakdown
    with per-night hotel budget and per-day activity budget
    """
    
    def __init__(self):
        # Enhanced allocation percentages for different trip types
        self.trip_type_allocations = {
            "luxurious": {
                "accommodation": 40,
                "transport": 25,
                "activities": 20,
                "food": 10,
                "miscellaneous": 5
            },
            "adventurous": {
                "accommodation": 25,
                "transport": 20,
                "activities": 35,
                "food": 12,
                "miscellaneous": 8
            },
            "family": {
                "accommodation": 30,
                "transport": 25,
                "activities": 25,
                "food": 15,
                "miscellaneous": 5
            },
            "budget": {
                "accommodation": 30,
                "transport": 30,
                "activities": 20,
                "food": 15,
                "miscellaneous": 5
            },
            "cultural": {
                "accommodation": 28,
                "transport": 22,
                "activities": 30,
                "food": 15,
                "miscellaneous": 5
            }
        }
    
    def allocate_budget(self, trip_request: TripRequest) -> Dict:
        """
        Allocate budget and return detailed breakdown including per-night and per-day budgets
        """
        trip_type = trip_request.trip_type.lower()
        total_budget = trip_request.budget
        
        # Convert dates to date objects if they're strings
        start_date = trip_request.start_date if isinstance(trip_request.start_date, date) else datetime.fromisoformat(trip_request.start_date).date()
        end_date = trip_request.end_date if isinstance(trip_request.end_date, date) else datetime.fromisoformat(trip_request.end_date).date()
        
        days = (end_date - start_date).days
        nights = days  # Same as days for hotel booking
        
        # Get base allocation percentages
        if trip_type in self.trip_type_allocations:
            allocation = self.trip_type_allocations[trip_type]
        else:
            allocation = self.trip_type_allocations["family"]
        
        # Calculate actual amounts
        breakdown = []
        allocated_amounts = {}
        
        for category, percentage in allocation.items():
            value = (percentage / 100) * total_budget
            breakdown.append(
                BudgetBreakdown(
                    name=category.capitalize(),
                    value=round(value, 2),
                    percentage=percentage
                )
            )
            allocated_amounts[category] = round(value, 2)
        
        # Calculate per-night hotel budget
        hotel_budget_per_night = allocated_amounts["accommodation"] / nights if nights > 0 else allocated_amounts["accommodation"]
        
        # Calculate per-day activity budget
        activities_budget_per_day = allocated_amounts["activities"] / days if days > 0 else allocated_amounts["activities"]
        
        # Get hardcoded recommendations
        recommendations = self._get_budget_recommendations(trip_request, breakdown, days, allocated_amounts)
        
        # Return enhanced response with pipeline data
        return {
            "budget_response": BudgetResponse(
                total=total_budget,
                breakdown=breakdown,
                recommendations=recommendations
            ),
            "pipeline_data": {
                "total_budget": total_budget,
                "accommodation_budget": allocated_amounts["accommodation"],
                "hotel_budget_per_night": round(hotel_budget_per_night, 2),
                "transport_budget": allocated_amounts["transport"],
                "activities_budget": allocated_amounts["activities"],
                "activities_budget_per_day": round(activities_budget_per_day, 2),
                "food_budget": allocated_amounts["food"],
                "food_budget_per_day": round(allocated_amounts["food"] / days, 2) if days > 0 else allocated_amounts["food"],
                "miscellaneous_budget": allocated_amounts["miscellaneous"],
                "trip_duration_days": days,
                "trip_duration_nights": nights
            }
        }
    
    def _get_budget_recommendations(self, trip_request: TripRequest, breakdown: List[BudgetBreakdown], days: int, allocated_amounts: Dict) -> str:
        """
        Generate  budget recommendations based on trip type and destination
        """
        accommodation = allocated_amounts.get("accommodation", 0)
        activities = allocated_amounts.get("activities", 0)
        food = allocated_amounts.get("food", 0)
        transport = allocated_amounts.get("transport", 0)
        
        # Base recommendations
        tips = [
            f"• Book accommodation early in {trip_request.destination} to get better rates",
            f"• Budget ₹{activities:.0f} for {days} days of activities and sightseeing",
            f"• Allocate ₹{food:.0f} for food - try local restaurants for authentic cuisine",
            f"• Reserve ₹{transport:.0f} for transport - use local transport to save costs"
        ]
        
        # Add trip-type specific recommendations
        trip_type = trip_request.trip_type.lower()
        if trip_type == "luxurious":
            tips.append("• Consider premium experiences and fine dining options")
            tips.append("• Book spa treatments and luxury tours in advance")
        elif trip_type == "adventurous":
            tips.append("• Invest in quality adventure activities and guided tours")
            tips.append("• Pack appropriate gear to avoid expensive rentals")
        elif trip_type == "family":
            tips.append("• Look for family packages and group discounts")
            tips.append("• Plan kid-friendly activities with flexible timings")
        elif trip_type == "budget":
            tips.append("• Use public transport and eat at local eateries")
            tips.append("• Book hostels or budget hotels to save on accommodation")
        elif trip_type == "cultural":
            tips.append("• Allocate budget for museum entries and cultural tours")
            tips.append("• Hire local guides for authentic cultural experiences")
        
        # Return top 5 recommendations
        return "\n".join(tips[:5])


enhanced_budget_agent = EnhancedBudgetAgent()
