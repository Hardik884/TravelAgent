import google.generativeai as genai
from typing import List
from models.schemas import ItineraryRequest, ItineraryResponse, DayPlan, Activity
from config import settings
from datetime import datetime, timedelta
import json


class ActivitiesAgent:
    """
    Agent responsible for generating day-by-day itinerary with activities
    Uses AI to create personalized plans based on trip type and destination
    """
    
    def __init__(self):
        genai.configure(api_key=settings.google_ai_api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def generate_itinerary(self, request: ItineraryRequest) -> ItineraryResponse:
        """
        Generate a complete day-by-day itinerary
        """
        days = (request.end_date - request.start_date).days
        
        # Get AI-generated itinerary
        itinerary = self._generate_ai_itinerary(request, days)
        
        # Calculate total cost
        total_cost = sum(
            sum(activity.cost for activity in day.activities)
            for day in itinerary
        )
        
        # Get recommendations
        recommendations = self._get_recommendations(request, itinerary, total_cost)
        
        return ItineraryResponse(
            itinerary=itinerary,
            total_activities_cost=total_cost,
            recommendations=recommendations
        )
    
    def _generate_ai_itinerary(self, request: ItineraryRequest, num_days: int) -> List[DayPlan]:
        """
        Use AI to generate detailed itinerary
        """
        interests_str = ", ".join(request.interests) if request.interests else "general tourism"
        
        prompt = f"""
        Create a detailed {num_days}-day itinerary for {request.destination}.
        
        Trip Details:
        - Type: {request.trip_type}
        - Start Date: {request.start_date}
        - Budget for activities: ₹{request.budget_allocation:,.0f}
        - Interests: {interests_str}
        
        For each day, suggest 3-4 activities with:
        - name: activity name
        - icon: single emoji representing the activity
        - time: suggested time (e.g., "09:00 AM")
        - cost: estimated cost in INR (0 for free activities)
        - description: brief description (one sentence)
        
        Ensure activities are:
        1. Appropriate for the trip type
        2. Realistic for the destination
        3. Well-timed throughout the day
        4. Within the budget allocation
        
        Return as JSON array with this structure:
        [
          {{
            "day": 1,
            "activities": [
              {{"name": "...", "icon": "🏨", "time": "...", "cost": 0, "description": "..."}}
            ]
          }}
        ]
        
        Return ONLY valid JSON, no other text.
        """
        
        try:
            response = self.model.generate_content(prompt)
            content = response.text.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            days_data = json.loads(content)
            
            # Convert to DayPlan objects
            itinerary = []
            current_date = request.start_date
            
            for day_data in days_data:
                activities = [
                    Activity(
                        name=act["name"],
                        icon=act.get("icon", "📍"),
                        time=act["time"],
                        cost=float(act.get("cost", 0)),
                        description=act["description"]
                    )
                    for act in day_data["activities"]
                ]
                
                day_cost = sum(act.cost for act in activities)
                
                itinerary.append(DayPlan(
                    day=day_data["day"],
                    date=current_date.strftime("%Y-%m-%d"),
                    activities=activities,
                    total_cost=day_cost
                ))
                
                current_date += timedelta(days=1)
            
            return itinerary
            
        except Exception as e:
            print(f"Error generating AI itinerary: {e}")
            return self._generate_fallback_itinerary(request, num_days)
    
    def _generate_fallback_itinerary(self, request: ItineraryRequest, num_days: int) -> List[DayPlan]:
        """
        Generate fallback itinerary if AI fails
        """
        itinerary = []
        current_date = request.start_date
        budget_per_day = request.budget_allocation / num_days if num_days > 0 else request.budget_allocation
        
        # Generic activities for different trip types
        activity_templates = {
            "luxurious": [
                {"name": "Spa & Wellness", "icon": "💆", "time": "10:00 AM", "cost_pct": 0.3},
                {"name": "Fine Dining Experience", "icon": "🍽️", "time": "07:30 PM", "cost_pct": 0.35},
                {"name": "Private City Tour", "icon": "🚗", "time": "02:00 PM", "cost_pct": 0.25},
            ],
            "adventurous": [
                {"name": "Trekking Expedition", "icon": "🥾", "time": "07:00 AM", "cost_pct": 0.35},
                {"name": "Water Sports", "icon": "🏄", "time": "02:00 PM", "cost_pct": 0.4},
                {"name": "Camping Experience", "icon": "⛺", "time": "06:00 PM", "cost_pct": 0.15},
            ],
            "family": [
                {"name": "Local Museum Visit", "icon": "🏛️", "time": "10:00 AM", "cost_pct": 0.15},
                {"name": "Family Restaurant", "icon": "🍴", "time": "01:00 PM", "cost_pct": 0.25},
                {"name": "Theme Park", "icon": "🎢", "time": "03:00 PM", "cost_pct": 0.35},
            ],
            "cultural": [
                {"name": "Heritage Walk", "icon": "🏛️", "time": "09:00 AM", "cost_pct": 0.2},
                {"name": "Traditional Performance", "icon": "🎭", "time": "06:00 PM", "cost_pct": 0.3},
                {"name": "Local Market Exploration", "icon": "🛍️", "time": "04:00 PM", "cost_pct": 0.15},
            ],
            "budget": [
                {"name": "Free Walking Tour", "icon": "🚶", "time": "09:00 AM", "cost_pct": 0.05},
                {"name": "Street Food Tour", "icon": "🍜", "time": "12:00 PM", "cost_pct": 0.15},
                {"name": "Public Park Visit", "icon": "🏞️", "time": "04:00 PM", "cost_pct": 0},
            ]
        }
        
        templates = activity_templates.get(request.trip_type.lower(), activity_templates["family"])
        
        for day in range(1, num_days + 1):
            activities = []
            
            # Add check-in on first day
            if day == 1:
                activities.append(Activity(
                    name="Hotel Check-in & Relaxation",
                    icon="🏨",
                    time="12:00 PM",
                    cost=0,
                    description=f"Arrive and settle into your accommodation in {request.destination}"
                ))
            
            # Add activities from templates
            for i, template in enumerate(templates[:3]):
                cost = budget_per_day * template["cost_pct"]
                activities.append(Activity(
                    name=template["name"],
                    icon=template["icon"],
                    time=template["time"],
                    cost=round(cost, 2),
                    description=f"Experience {template['name'].lower()} in {request.destination}"
                ))
            
            day_cost = sum(act.cost for act in activities)
            
            itinerary.append(DayPlan(
                day=day,
                date=current_date.strftime("%Y-%m-%d"),
                activities=activities,
                total_cost=day_cost
            ))
            
            current_date += timedelta(days=1)
        
        return itinerary
    
    def _get_recommendations(self, request: ItineraryRequest, itinerary: List[DayPlan], total_cost: float) -> str:
        """
        Get AI recommendations for the itinerary
        """
        prompt = f"""
        Review this {len(itinerary)}-day itinerary for {request.destination} and provide 3 practical tips:
        
        Trip Type: {request.trip_type}
        Total Activities Cost: ₹{total_cost:,.0f}
        Budget Allocated: ₹{request.budget_allocation:,.0f}
        
        Provide brief, actionable tips about:
        - Timing and logistics
        - Cost optimization
        - Must-do experiences
        
        Keep response to 3 bullet points, concise.
        """
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error getting recommendations: {e}")
            return "Book activities in advance for better rates. Stay flexible with timings. Try local experiences for authentic memories."


# Initialize agent instance
activities_agent = ActivitiesAgent()
