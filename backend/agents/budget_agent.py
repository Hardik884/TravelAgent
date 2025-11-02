import google.generativeai as genai
import logging
from typing import Dict, List
from models.schemas import TripRequest, BudgetResponse, BudgetBreakdown
from config import settings
from datetime import datetime, date
import json


class BudgetAgent:
    """
    Agent responsible for dividing the total budget into categories
    based on trip type and providing intelligent budget allocation
    """
    
    def __init__(self):
        genai.configure(api_key=settings.google_ai_api_key)
        self.model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config={
                'temperature': 0.7,
                'max_output_tokens': 200,
            },
            safety_settings={
                'HARM_CATEGORY_HARASSMENT': 'BLOCK_NONE',
                'HARM_CATEGORY_HATE_SPEECH': 'BLOCK_NONE',
                'HARM_CATEGORY_SEXUALLY_EXPLICIT': 'BLOCK_NONE',
                'HARM_CATEGORY_DANGEROUS_CONTENT': 'BLOCK_NONE'
            }
        )
        
        # Base allocation percentages for different trip types
        self.trip_type_allocations = {
            "luxurious": {
                "accommodation": 40,
                "transport": 25,
                "activities": 20,
                "food": 10,
                "misc": 5
            },
            "adventurous": {
                "accommodation": 25,
                "transport": 30,
                "activities": 30,
                "food": 10,
                "misc": 5
            },
            "family": {
                "accommodation": 35,
                "transport": 25,
                "activities": 25,
                "food": 10,
                "misc": 5
            },
            "budget": {
                "accommodation": 35,
                "transport": 30,
                "activities": 20,
                "food": 10,
                "misc": 5
            },
            "cultural": {
                "accommodation": 30,
                "transport": 25,
                "activities": 30,
                "food": 10,
                "misc": 5
            }
        }
        self.logger = logging.getLogger(__name__)
    
    def allocate_budget(self, trip_request: TripRequest) -> BudgetResponse:
        """
        Allocate budget based on trip type and use AI for recommendations
        """
        trip_type = trip_request.trip_type.lower()
        total_budget = trip_request.budget
        
        # Get base allocation percentages
        if trip_type in self.trip_type_allocations:
            allocation = self.trip_type_allocations[trip_type]
        else:
            # Default allocation
            allocation = self.trip_type_allocations["family"]
        
        # Calculate actual amounts
        breakdown = []
        for category, percentage in allocation.items():
            value = (percentage / 100) * total_budget
            breakdown.append(
                BudgetBreakdown(
                    name=category.capitalize(),
                    value=round(value, 2),
                    percentage=percentage
                )
            )
        
        # Get AI recommendations
        recommendations = self._get_ai_recommendations(trip_request, breakdown)
        
        return BudgetResponse(
            total=total_budget,
            breakdown=breakdown,
            recommendations=recommendations
        )
    
    def _get_ai_recommendations(self, trip_request: TripRequest, breakdown: List[BudgetBreakdown]) -> str:
        """
        Use AI to generate personalized budget recommendations
        """
        # Convert dates to date objects if they're strings
        start_date = trip_request.start_date if isinstance(trip_request.start_date, date) else datetime.fromisoformat(trip_request.start_date).date()
        end_date = trip_request.end_date if isinstance(trip_request.end_date, date) else datetime.fromisoformat(trip_request.end_date).date()
        
        days = (end_date - start_date).days
        
        prompt = f"""Give 3 budget tips for a {days}-day {trip_request.trip_type} trip to {trip_request.destination} with {trip_request.budget} rupees budget."""
        
        try:
            response = self.model.generate_content(
                prompt,
                request_options={'timeout': 10}
            )
            
            # Check if response has text
            if hasattr(response, 'text') and response.text:
                return response.text.strip()
            elif response.candidates and len(response.candidates) > 0:
                # Try to get text from first candidate
                candidate = response.candidates[0]
                if hasattr(candidate.content, 'parts') and candidate.content.parts:
                    return candidate.content.parts[0].text.strip()
            
            # If no valid response, use fallback
            raise Exception("No valid response from AI")
            
        except Exception as e:
            self.logger.exception("Error getting AI recommendations: %s", e)
            return f"• Book accommodation early in {trip_request.destination}\n• Use local transport to save costs\n• Try local restaurants for authentic food\n• Reserve ₹{breakdown[2].value:.0f} for activities"


# Initialize agent instance
budget_agent = BudgetAgent()
