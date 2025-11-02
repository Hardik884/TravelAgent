import google.generativeai as genai
import logging
from typing import List
from models.schemas import ItineraryRequest, ItineraryResponse, DayPlan, Activity
from config import settings
from datetime import datetime, timedelta
import json
import time


class ActivitiesAgent:
    """
    Agent responsible for generating day-by-day itinerary with activities
    Uses AI to create personalized plans based on trip type and destination
    """
    
    def __init__(self):
        genai.configure(api_key=settings.google_ai_api_key)
        self.logger = logging.getLogger(__name__)
        self.system_instruction = (
            "You are a precise travel planner. Respond only with a single JSON array where each day object contains "
            "exactly the fields day (int) and activities (list). Each activities entry must include name, icon, time, cost, "
            "and description. Output must be valid minified JSON with no markdown or commentary. Descriptions can be up to 250 characters, "
            "costs are positive integers, and day 1 begins with a hotel check-in entry. If the response risks exceeding the token limit, "
            "prioritize keeping at least 3 activities per day and shorten descriptions, but prefer more activities up to 5 when possible."
        )
        self.model = genai.GenerativeModel(
            model_name='gemini-2.0-flash-lite',
            generation_config={
                'temperature': 0.45,
                'max_output_tokens': 2200,
                'candidate_count': 1,
                'top_p': 0.8
            },
            safety_settings={
                'HARM_CATEGORY_HARASSMENT': 'BLOCK_NONE',
                'HARM_CATEGORY_HATE_SPEECH': 'BLOCK_NONE',
                'HARM_CATEGORY_SEXUALLY_EXPLICIT': 'BLOCK_NONE',
                'HARM_CATEGORY_DANGEROUS_CONTENT': 'BLOCK_NONE'
            }
        )
    
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
        
        # Calculate per-day budget
        budget_per_day = request.budget_allocation / num_days if num_days > 0 else request.budget_allocation
        
        self.logger.info("Generating itinerary for %s (%s days)", request.destination, num_days)
        self.logger.debug("  - Total activities budget: ₹%s", f"{request.budget_allocation:,.2f}")
        self.logger.debug("  - Per day budget: ₹%s", f"{budget_per_day:,.2f}")
        
        # Ultra-compact prompt with strict output limits
        trip_focus = {
            "luxurious": "luxury venues",
            "adventurous": "outdoor/sports",
            "family": "family-friendly",
            "cultural": "heritage/temples",
            "beach": "water activities"
        }.get(request.trip_type, "attractions")
        
        example_json = '[{"day":1,"activities":[{"name":"Hotel Check-in","icon":"🏨","time":"02:00 PM","cost":0,"description":"Arrive at your hotel and complete check-in process"},{"name":"Dinner at Natraj Dining Hall","icon":"🍽️","time":"08:00 PM","cost":900,"description":"Enjoy authentic Rajasthani thali with traditional dal, vegetables, and fresh roti"},{"name":"Bagore Ki Haveli folk show","icon":"🏛️","time":"07:00 PM","cost":1200,"description":"Experience traditional dance performances and puppet shows"}]}]'
        prompt = (
            f"{self.system_instruction}\n"
            f"Plan {num_days} sightseeing days in {request.destination} for a {request.trip_type} trip. "
            f"Daily activities budget: INR {budget_per_day:,.0f}. Focus: {trip_focus}. Interests: {interests_str}. "
            f"Return a single minified JSON array with exactly {num_days} day objects. Each day object strictly uses "
            "the keys day (int) and activities (list). Activities must be in chronological order with time in \"hh:mm AM/PM\" format. "
            "Day 1 activity[0] must be Hotel Check-in at 02:00 PM, cost 0, icon 🏨. After check-in include breakfast venue, signature "
            "experience, and dinner venue (four entries total on day 1). Other days require exactly three entries: breakfast venue, main "
            "experience, dinner venue. Use authentic local names, keep descriptions under 250 characters, and costs as integers in INR. "
            "Use concise icons such as 🍽️ for meals and 🎡/🏛️/🌄 for activities. No narration, markdown, or trailing text. "
            f"Example:{example_json}"
        )
        
        try:
            # Retry logic for rate limiting (429 errors)
            max_retries = 3
            retry_delay = 2  # Start with 2 seconds
            
            for attempt in range(max_retries):
                try:
                    response = self.model.generate_content(prompt)
                    break  # Success, exit retry loop
                except Exception as rate_error:
                    error_msg = str(rate_error)
                    if "429" in error_msg or "Resource exhausted" in error_msg:
                        if attempt < max_retries - 1:
                            wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                            self.logger.warning("Rate limit hit (429). Retrying in %ss... (attempt %s/%s)", wait_time, attempt + 1, max_retries)
                            time.sleep(wait_time)
                        else:
                            self.logger.warning("Rate limit exceeded after %s attempts. Using fallback itinerary.", max_retries)
                            return self._generate_fallback_itinerary(request, num_days)
                    else:
                        # Not a rate limit error, re-raise
                        raise
            
            if not response.candidates:
                self.logger.warning("AI response missing candidates; falling back")
                return self._generate_fallback_itinerary(request, num_days)

            primary_candidate = response.candidates[0]
            parts = list(getattr(primary_candidate.content, "parts", []) or [])
            finish_reason_name = getattr(primary_candidate.finish_reason, "name", "")
            finish_reason_val = getattr(primary_candidate.finish_reason, "value", 0)

            if not parts:
                self.logger.warning("AI response empty (finish_reason: %s)", finish_reason_name or 'UNKNOWN')
                self.logger.debug("Destination: %s", request.destination)
                self.logger.debug("Trip type: %s", request.trip_type)
                return self._generate_fallback_itinerary(request, num_days)

            if finish_reason_name and finish_reason_name != "STOP":
                self.logger.warning("AI response incomplete (finish_reason: %s)", finish_reason_name)
                if finish_reason_val == 2:
                    self.logger.warning("ISSUE: Response exceeded token limit (MAX_TOKENS). Attempting JSON repair before fallback.")
                elif finish_reason_val == 3:
                    self.logger.warning("ISSUE: Safety filter triggered for '%s'.", request.destination)
                else:
                    self.logger.warning("ISSUE: Finish reason value: %s", finish_reason_val)

            # Build content safely from parts
            content = "".join(getattr(part, "text", "") for part in parts).strip()

            if not content:
                self.logger.warning("AI response produced empty text; using fallback")
                return self._generate_fallback_itinerary(request, num_days)
            
            # Clean up markdown code blocks
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            # Remove any text before the first [ and after the last ]
            start_idx = content.find('[')
            end_idx = content.rfind(']')
            if start_idx != -1 and end_idx != -1:
                content = content[start_idx:end_idx+1]
            
            # Clean up common JSON issues
            content = content.strip()
            
            # Try to parse JSON
            try:
                days_data = json.loads(content)
                self.logger.info("JSON parsed successfully on first try")
            except json.JSONDecodeError as json_err:
                self.logger.warning("JSON parsing error: %s", json_err)
                self.logger.debug("Content preview: %s...", content[:500])
                
                # Try to fix common issues
                import re
                
                self.logger.debug("Attempting to fix JSON...")
                
                # 1. Remove trailing commas before } or ]
                content = re.sub(r',(\s*[}\]])', r'\1', content)
                
                # 2. Fix truncated descriptions - more aggressive approach
                # Look for description fields that might be truncated
                def fix_truncated_description(match):
                    full_line = match.group(0)
                    # If the description doesn't end with a quote followed by comma or closing brace
                    if not re.search(r'"\s*[,}]', full_line):
                        # Find where it should end (before next field or closing brace)
                        # Truncate at reasonable length and close the string
                        desc_value = match.group(1)
                        if len(desc_value) > 80:
                            desc_value = desc_value[:77] + '...'
                        return f'"description": "{desc_value}"'
                    return full_line
                
                # Fix description fields that might be incomplete
                content = re.sub(r'"description"\s*:\s*"([^"]*)', fix_truncated_description, content)
                
                # 3. Remove any trailing commas again
                content = re.sub(r',(\s*[}\]])', r'\1', content)
                
                # 4. Check for unclosed brackets/braces
                open_brackets = content.count('[') - content.count(']')
                open_braces = content.count('{') - content.count('}')
                
                if open_braces > 0 or open_brackets > 0:
                    self.logger.debug("Closing %s braces and %s brackets", open_braces, open_brackets)
                    
                    # Smart closing: determine what needs to be closed based on structure
                    # Check last non-whitespace character to determine context
                    last_content = content.rstrip()
                    
                    # If last char is comma or quote, we're likely in an object
                    if last_content.endswith((',', '"')):
                        # Close the current field/object properly
                        if open_braces >= 2:
                            content += '\n      }'  # Close activity
                            open_braces -= 1
                        if open_braces >= 1:
                            content += '\n    }'  # Close day
                            open_braces -= 1
                        if open_brackets >= 1:
                            content += '\n    ]'  # Close activities array
                            open_brackets -= 1
                        if open_brackets >= 1:
                            content += '\n]'  # Close days array
                            open_brackets -= 1
                    
                    # Close any remaining structures
                    for _ in range(open_braces):
                        content += '\n  }'
                    for _ in range(open_brackets):
                        content += '\n]'
                
                # 5. Try parsing again
                try:
                    days_data = json.loads(content)
                    self.logger.info("Fixed and parsed JSON successfully")
                except Exception as retry_err:
                    self.logger.warning("Still failing: %s", retry_err)
                    
                    # 6. Last resort: Extract only complete day objects
                    self.logger.debug("Attempting to salvage complete days...")
                    try:
                        # More lenient pattern that matches complete day objects
                        day_pattern = r'\{\s*"day"\s*:\s*\d+\s*,\s*"activities"\s*:\s*\[\s*(?:\{(?:[^{}]|\{[^}]*\})*\}\s*,?\s*)*\]\s*\}'
                        day_matches = re.findall(day_pattern, content, re.DOTALL)
                        
                        if day_matches:
                            # Clean each match
                            clean_days = []
                            for day_match in day_matches:
                                # Remove trailing commas
                                day_match = re.sub(r',(\s*[}\]])', r'\1', day_match)
                                clean_days.append(day_match)
                            
                            content = '[' + ','.join(clean_days) + ']'
                            days_data = json.loads(content)
                            self.logger.info("Salvaged %s complete days", len(day_matches))
                        else:
                            self.logger.warning("Could not salvage any days, using fallback")
                            return self._generate_fallback_itinerary(request, num_days)
                    except:
                        self.logger.warning("Could not fix JSON, using fallback")
                        return self._generate_fallback_itinerary(request, num_days)
            
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
            self.logger.exception("Error generating AI itinerary: %s", e)
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
        Get smart hardcoded recommendations based on trip type and budget analysis
        No AI calls - instant response, zero rate limits
        """
        num_days = len(itinerary)
        budget_per_day = request.budget_allocation / num_days if num_days > 0 else 0
        cost_per_day = total_cost / num_days if num_days > 0 else 0
        
        # Base universal tips that work for everyone
        tips = []
        
        # Tip 1: Timing advice based on trip length
        if num_days <= 2:
            tips.append("• Start your day early (7-8 AM) to maximize sightseeing time in your short trip")
        elif num_days <= 4:
            tips.append("• Begin sightseeing by 9 AM to avoid midday crowds and heat, leaving evenings for leisurely exploration")
        else:
            tips.append("• Pace yourself with early starts (8-9 AM) and afternoon breaks - marathon trips need energy management")
        
        # Tip 2: Budget-specific advice
        budget_utilization = (cost_per_day / budget_per_day * 100) if budget_per_day > 0 else 0
        if budget_utilization < 60:
            tips.append(f"• You're under-budget at ₹{cost_per_day:,.0f}/day - consider adding premium experiences or better dining options")
        elif budget_utilization > 90:
            tips.append(f"• Budget is tight at ₹{cost_per_day:,.0f}/day - look for combo tickets and free walking tours to save costs")
        else:
            tips.append("• Book popular attractions online in advance to skip queues and often get 10-15% discounts")
        
        # Tip 3: Trip-type specific advice
        trip_type_tips = {
            "luxurious": "• Pre-book spa treatments and fine dining reservations - luxury venues fill up fast, especially weekends",
            "adventurous": "• Check weather forecasts daily and have backup indoor activities ready for outdoor adventure plans",
            "family": "• Plan activities with breaks every 2-3 hours - kids (and adults!) need downtime between attractions",
            "cultural": "• Hire local guides at heritage sites - they reveal fascinating stories that plaques and apps miss",
            "beach": "• Apply sunscreen 30 mins before beach time and reapply every 2 hours - skin protection is non-negotiable",
            "budget": "• Eat where locals eat - street food and neighborhood eateries offer authentic taste at 1/3rd the tourist area prices",
            "romantic": "• Book sunset experiences and rooftop dinners early - the best romantic spots have limited seating",
            "solo": "• Join group tours or cooking classes to meet fellow travelers while exploring safely",
            "business": "• Keep digital copies of all bookings and have offline maps downloaded - stay productive even without wifi"
        }
        
        trip_tip = trip_type_tips.get(request.trip_type.lower(), 
                                       "• Try local cuisine at neighborhood restaurants - authentic experiences are found off the tourist trail")
        tips.append(trip_tip)
        
        # Tip 4: Destination-specific wisdom (optional 4th tip)
        destination_lower = request.destination.lower()
        if any(city in destination_lower for city in ["mumbai", "delhi", "bangalore", "kolkata", "chennai"]):
            tips.append("• Use app-based cabs or metro instead of auto-rickshaws in big cities - transparent pricing saves haggling time")
        elif any(place in destination_lower for place in ["goa", "kerala", "pondicherry", "andaman"]):
            tips.append("• Rent a scooter or bike for the day (₹300-500) - coastal areas are best explored at your own pace")
        elif any(place in destination_lower for place in ["rajasthan", "jaipur", "udaipur", "jodhpur", "jaisalmer"]):
            tips.append("• Carry a water bottle and stay hydrated - Rajasthan's dry climate can be deceptive, especially while sightseeing")
        elif any(place in destination_lower for place in ["manali", "shimla", "darjeeling", "mussoorie", "nainital"]):
            tips.append("• Pack layers and a light jacket even in summer - hill stations get chilly in evenings and early mornings")
        
        return '\n'.join(tips)


# Initialize agent instance
activities_agent = ActivitiesAgent()
