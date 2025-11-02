import google.generativeai as genai
import logging
from typing import List, Dict
from models.schemas import HotelSearchRequest, HotelSearchResponse, Hotel
from config import settings
import json
import random
import requests
from datetime import datetime


class HotelAgent:
    """
    Agent responsible for searching and recommending hotels
    Uses RapidAPI (Booking.com) for REAL hotel data 
    """
    
    def __init__(self):
        genai.configure(api_key=settings.google_ai_api_key)
        self.model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config={
                'temperature': 0.8,
                'max_output_tokens': 4000,
            },
            safety_settings={
                'HARM_CATEGORY_HARASSMENT': 'BLOCK_NONE',
                'HARM_CATEGORY_HATE_SPEECH': 'BLOCK_NONE',
                'HARM_CATEGORY_SEXUALLY_EXPLICIT': 'BLOCK_NONE',
                'HARM_CATEGORY_DANGEROUS_CONTENT': 'BLOCK_NONE'
            }
        )
        self.rapidapi_key = getattr(settings, 'rapidapi_key', None)
        self.logger = logging.getLogger(__name__)
        
        if self.rapidapi_key:
            # Debug: don't expose full key in logs, only indicate presence
            self.logger.debug("RapidAPI key present (masked)")
        else:
            self.logger.warning("No RapidAPI key found in settings")
    
    def search_hotels(self, request: HotelSearchRequest) -> HotelSearchResponse:
        """
        Search hotels using HYBRID approach:
        1. Get REAL hotel names/locations from Amadeus
        2. Generate realistic AI pricing based on hotel tier and location
        """
        # Debug: print incoming request summary for troubleshooting
        try:
            self.logger.debug("Hotel search requested: %s", {
                'destination': request.destination,
                'check_in': getattr(request.check_in, 'isoformat', lambda: request.check_in)(),
                'check_out': getattr(request.check_out, 'isoformat', lambda: request.check_out)(),
                'adults': request.adults,
                'children': request.children,
                'max_price': request.max_price,
                'trip_type': request.trip_type,
            })
        except Exception:
            # Safe fallback logging
            self.logger.debug("Hotel search requested: destination=%s max_price=%s", request.destination, request.max_price)
        # Try Amadeus API for real hotel names and locations
        try:
            from agents.amadeus_integration import amadeus_service
            
            # Get city code
            city_code = amadeus_service.get_city_code(request.destination)
            
            if city_code and amadeus_service.client:
                self.logger.debug("Fetching REAL hotel names from Amadeus: %s (%s)", request.destination, city_code)
                
                # Get real hotel directory (names, locations) - reduced for speed
                real_hotels_list = amadeus_service.get_hotels_list(
                    city_code=city_code,
                    max_results=10  # Reduced from 15 for faster response
                )
                
                if real_hotels_list and len(real_hotels_list) > 0:
                    self.logger.debug("Got %d real hotels from Amadeus", len(real_hotels_list))
                    
                    # Calculate budget constraints
                    nights = (request.check_out - request.check_in).days
                    # Frontend sends total accommodation budget as max_price, which IS the per-night budget
                    max_price_per_night = request.max_price if request.max_price else 8000
                    
                    self.logger.debug("Using per-night budget: %s for %d nights", max_price_per_night, nights)
                    
                    # Generate AI pricing for real hotels
                    hotels = self._generate_pricing_for_real_hotels(
                        real_hotels_list,
                        request,
                        max_price_per_night
                    )
                    
                    if hotels:
                        self.logger.debug("Created %d hotels with REAL names + AI pricing", len(hotels))
                        return HotelSearchResponse(
                            hotels=hotels,
                            total_count=len(hotels)
                        )
                else:
                    self.logger.warning("Amadeus returned empty hotel list for destination: %s", request.destination)
        
        except ImportError:
            self.logger.warning("Amadeus service not available, using generated data")
        except Exception as e:
            self.logger.exception("Hotel search error: %s", e)

        # Fallback to fully generated realistic data
        self.logger.info("Falling back to generated hotels for: %s", request.destination)
        # Frontend sends total accommodation budget as max_price, which IS the per-night budget
        max_price_per_night = request.max_price if request.max_price else 5000
        nights = (request.check_out - request.check_in).days
        self.logger.debug("Using per-night budget: %s for %d nights", max_price_per_night, nights)
        
        hotels = self._generate_fallback_hotels(request, max_price_per_night)

        return HotelSearchResponse(
            hotels=hotels,
            total_count=len(hotels)
        )
    
    def _generate_pricing_for_real_hotels(
        self, 
        real_hotels: List[Dict], 
        request: HotelSearchRequest,
        max_price_per_night: float
    ) -> List[Hotel]:
        """
        Generate realistic AI pricing for real hotel names from Amadeus
        Uses the SAME pricing distribution as fallback hotels for consistency
        """
        hotels = []
        
        # Filter out test/dummy hotels from Amadeus test environment
        test_keywords = ['test', 'testing', 'dummy', 'sample', 'example', 'fake']
        
        # Filter valid hotels
        valid_hotels = []
        for hotel_data in real_hotels:
            hotel_name = hotel_data['name']
            hotel_name_lower = hotel_name.lower()
            
            # Skip test/dummy hotels from Amadeus sandbox
            if any(keyword in hotel_name_lower for keyword in test_keywords):
                self.logger.debug("Skipping test hotel: %s", hotel_name)
                continue
            
            valid_hotels.append(hotel_data)
        
        if not valid_hotels:
            self.logger.warning("No valid hotels after filtering test data")
            return []
        
        # Use the same pricing distribution as fallback hotels
        hotels_to_generate = min(10, len(valid_hotels))
        
        # Calculate price distribution - from 25% to 100% of max budget
        min_price = max_price_per_night * 0.25
        
        self.logger.debug("Generating Amadeus hotel prices: %s to %s", f"₹{min_price:.0f}", f"₹{max_price_per_night:.0f}")
        
        for i in range(hotels_to_generate):
            hotel_data = valid_hotels[i]
            
            # Distribute prices evenly across the range with added randomness
            # This ensures EVERY hotel has a different price
            position = i / max(hotels_to_generate - 1, 1)  # 0 to 1
            
            # Calculate base target price for this position
            target_price = min_price + (position * (max_price_per_night - min_price))
            
            # Add unique randomness to each hotel (±8% of its target)
            unique_variance = target_price * random.uniform(-0.08, 0.08)
            price = target_price + unique_variance
            
            # Add small random jitter to prevent identical prices
            price += random.randint(-50, 150)
            
            # Ensure price stays within bounds
            price = max(min_price, min(price, max_price_per_night))
            
            # Light rounding only - keeps prices distinct
            if price > 3000:
                price = round(price / 10) * 10  # Round to nearest 10
            else:
                price = round(price / 5) * 5  # Round to nearest 5
            
            self.logger.debug("Hotel %d price: %s (position %.1f%%, target %s)", i+1, f"₹{price:.0f}", position*100, f"₹{target_price:.0f}")
            
            # Determine category based on position in price range
            price_ratio = (price - min_price) / (max_price_per_night - min_price)
            
            if price_ratio > 0.75:
                category = "luxury"
                rating = random.uniform(4.5, 4.9)
                tag = "Luxury Pick"
                amenities = ["Free WiFi", "Swimming Pool", "Spa", "Fine Dining", "Gym", "Concierge"]
            elif price_ratio > 0.5:
                category = "premium"
                rating = random.uniform(4.0, 4.5)
                tag = "Best Value"
                amenities = ["Free WiFi", "Restaurant", "Gym", "Room Service", "Business Center"]
            elif price_ratio > 0.3:
                category = "midrange"
                rating = random.uniform(3.7, 4.2)
                tag = "Family Friendly"
                amenities = ["Free WiFi", "Restaurant", "Room Service", "AC", "TV"]
            else:
                category = "budget"
                rating = random.uniform(3.4, 3.9)
                tag = "Budget Friendly"
                amenities = ["Free WiFi", "AC", "TV", "Breakfast"]
            
            # Get location info
            address = hotel_data.get('address', {})
            city_name = address.get('cityName', request.destination)
            
            # Create hotel object
            hotel = Hotel(
                id=f"amadeus_{hotel_data.get('hotel_id', i)}",
                name=hotel_data['name'],
                price=round(price, 0),
                rating=round(rating, 1),
                image=self._get_hotel_image(i),
                location=city_name,
                amenities=amenities[:5],
                description=f"Located in {city_name}. Real hotel with AI-estimated pricing.",
                tag=tag
            )
            hotels.append(hotel)
        
        # Sort by price
        hotels.sort(key=lambda x: x.price)
        
        self.logger.debug("Generated %d Amadeus hotels with prices", len(hotels))
        
        return hotels
    
    def _search_real_hotels(self, request: HotelSearchRequest) -> List[Hotel]:
        """
        """
        
        # Step 1: Search for destination
        search_url = "https://booking-com.p.rapidapi.com/v1/hotels/locations"
        
        clean_destination = request.destination.strip()

        self.logger.debug("Searching for destination: %s", clean_destination)
        self.logger.debug("RapidAPI key present (masked)")

        search_params = {
            "name": clean_destination,
            "locale": "en-gb"
        }
        search_headers = {
            "X-RapidAPI-Key": self.rapidapi_key,
            "X-RapidAPI-Host": "booking-com.p.rapidapi.com"
        }
        try:
            self.logger.debug("Making API call to: %s", search_url)
            search_response = requests.get(search_url, headers=search_headers, params=search_params, timeout=10)
            self.logger.debug("Response status: %s", search_response.status_code)
            search_response.raise_for_status()
            locations = search_response.json()
            self.logger.debug("Found %d locations from rapidapi", len(locations))
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                raise Exception(f"❌ API Key Invalid or Subscription Required. Visit: https://rapidapi.com/apidojo/api/booking")
            elif e.response.status_code == 429:
                raise Exception(f"⚠️ Rate Limit Exceeded (500 requests/month). Try again later or upgrade plan.")
            else:
                raise Exception(f"API Error {e.response.status_code}: {e}")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                raise Exception(f"❌ API Key Invalid or Subscription Required. Visit: https://rapidapi.com/apidojo/api/booking")
            elif e.response.status_code == 429:
                raise Exception(f"⚠️ Rate Limit Exceeded (500 requests/month). Try again later or upgrade plan.")
            else:
                raise Exception(f"API Error {e.response.status_code}: {e}")
        
        if not locations or len(locations) == 0:
            raise Exception(f"No location found for: {clean_destination}")
        
        dest_id = locations[0].get('dest_id')
        dest_type = locations[0].get('dest_type', 'city')
        
        if not dest_id:
            raise Exception(f"Invalid destination ID for: {clean_destination}")
        
        # Step 2: Search hotels
        hotels_url = "https://booking-com.p.rapidapi.com/v1/hotels/search"
        
        checkin = request.check_in.strftime('%Y-%m-%d')
        checkout = request.check_out.strftime('%Y-%m-%d')
        
        hotels_params = {
            "dest_id": dest_id,
            "dest_type": dest_type,
            "checkin_date": checkin,
            "checkout_date": checkout,
            "adults_number": request.adults,
            "children_number": request.children,
            "room_number": "1",
            "units": "metric",
            "order_by": "popularity",
            "filter_by_currency": "INR",
            "locale": "en-gb",
            "page_number": "0"
        }
        
        try:
            hotels_response = requests.get(hotels_url, headers=search_headers, params=hotels_params, timeout=15)
            hotels_response.raise_for_status()
            result = hotels_response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                raise Exception(f"⚠️ Rate Limit Exceeded. Monthly quota used. Upgrade or wait for reset.")
            else:
                raise Exception(f"Hotels API Error {e.response.status_code}: {e}")
        
        # Parse hotels
        hotels = []
        hotel_results = result.get('result', [])
        
        for idx, hotel_data in enumerate(hotel_results[:15]):  # Limit to 15 hotels
            try:
                # Get price
                price_breakdown = hotel_data.get('price_breakdown', {})
                gross_price = price_breakdown.get('gross_price', 0)
                
                # Convert to per night price
                nights = max((request.check_out - request.check_in).days, 1)
                price_per_night = float(gross_price) / nights if gross_price else 2000
                
                # Skip if over budget
                if price_per_night > request.max_price * 1.5:
                    continue
                
                # Get image
                main_photo = hotel_data.get('main_photo_url', '') or hotel_data.get('max_photo_url', '')
                if not main_photo:
                    main_photo = self._get_hotel_image(idx)
                
                # Determine tag
                tag = "Best Value"
                if price_per_night > 8000:
                    tag = "Luxury Pick"
                elif price_per_night < 1500:
                    tag = "Budget Friendly"
                elif hotel_data.get('is_family_friendly'):
                    tag = "Family Friendly"
                
                hotels.append(Hotel(
                    id=f"real_hotel_{hotel_data.get('hotel_id', idx)}",
                    name=hotel_data.get('hotel_name', f"Hotel {idx+1}"),
                    price=round(price_per_night, 0),
                    rating=float(hotel_data.get('review_score', 4.0)),
                    image=main_photo,
                    location=hotel_data.get('address', '') or hotel_data.get('city', request.destination),
                    amenities=self._parse_facilities(hotel_data.get('hotel_facilities', '')),
                    description=hotel_data.get('hotel_name_trans', hotel_data.get('hotel_name', '')),
                    tag=tag
                ))
            except Exception as e:
                self.logger.debug("Error parsing hotel %d: %s", idx, e)
                continue
        
        return hotels
    
    def _parse_facilities(self, facilities_string: str) -> List[str]:
        """Parse facilities from API response"""
        if not facilities_string:
            return ["WiFi", "Air Conditioning", "Room Service"]
        
        # Common facility mappings
        facility_map = {
            "wifi": "Free WiFi",
            "pool": "Swimming Pool",
            "gym": "Fitness Center",
            "spa": "Spa",
            "restaurant": "Restaurant",
            "bar": "Bar",
            "parking": "Free Parking",
            "breakfast": "Breakfast Included",
            "ac": "Air Conditioning",
            "room service": "Room Service"
        }
        
        facilities = []
        facilities_lower = facilities_string.lower()
        for key, value in facility_map.items():
            if key in facilities_lower and len(facilities) < 5:
                facilities.append(value)
        
        # Add defaults if empty
        if not facilities:
            facilities = ["WiFi", "Air Conditioning", "Room Service"]
        
        return facilities[:5]
    
    def _generate_hotels(self, request: HotelSearchRequest) -> List[Hotel]:
        """
        Generate hotel options using AI for realistic data
        """
        days = (request.check_out - request.check_in).days
        max_price_per_night = request.max_price / days if days > 0 else request.max_price
        
        prompt = f"""Generate 15 real hotels in {request.destination}, India as JSON array.

Budget: {int(max_price_per_night)} INR/night max
Type: {request.trip_type}

Use REAL Indian hotel chains: Taj, Oberoi, ITC, Leela, Marriott, Hyatt, Radisson, Novotel, Lemon Tree, Ginger, Treebo, FabHotel, OYO

Format (return ONLY JSON array, no markdown):
[{{"name":"Taj Palace Delhi","price":2500,"rating":4.2,"location":"Connaught Place","amenities":["WiFi","Pool","Gym"],"description":"Luxury hotel in city center","tag":"Luxury Pick"}}]

Rules:
- Use real hotel chain names + city
- price: number 800-{int(max_price_per_night*1.2)}
- rating: 3.5-4.8
- tag: "Luxury Pick","Budget Friendly","Family Friendly","Best Value"
- description: max 80 chars
- 15 hotels only"""
        
        try:
            response = self.model.generate_content(
                prompt,
                request_options={'timeout': 30}  # Reduced timeout
            )
            
            if not hasattr(response, 'text') or not response.text:
                self.logger.debug("No valid response from AI, using fallback")
                return self._generate_fallback_hotels(request, max_price_per_night)[:15]
            
            content = response.text.strip()
            
            # Clean markdown
            content = content.replace("```json", "").replace("```", "").strip()
            
            hotels_data = json.loads(content)
            
            # Convert to Hotel objects
            hotels = []
            for idx, hotel_data in enumerate(hotels_data[:15]):
                try:
                    price = float(hotel_data.get("price", 2000))
                    if price > max_price_per_night * 1.5:
                        price = max_price_per_night * 0.8
                    
                    hotels.append(Hotel(
                        id=f"hotel_{idx+1}",
                        name=hotel_data.get("name", f"Hotel {idx+1}"),
                        price=price,
                        rating=float(hotel_data.get("rating", 4.0)),
                        image=self._get_hotel_image(idx),
                        location=hotel_data.get("location", "City Center"),
                        amenities=hotel_data.get("amenities", ["WiFi", "Parking", "Breakfast"]),
                        description=hotel_data.get("description", "Comfortable accommodation"),
                        tag=hotel_data.get("tag", "Recommended")
                    ))
                except Exception as e:
                    self.logger.debug("Error parsing hotel %d: %s", idx, e)
                    continue
            
            # If AI generated fewer than 10 hotels, pad with fallback
            if len(hotels) < 10:
                self.logger.info("AI returned %d hotels; adding fallback hotels", len(hotels))
                fallback_hotels = self._generate_fallback_hotels(request, max_price_per_night)
                hotels.extend(fallback_hotels[:(15-len(hotels))])
            
            return hotels[:15]  # Return 15 hotels for faster loading
        except Exception as e:
            self.logger.exception("Error generating hotels with AI: %s", e)
            return self._generate_fallback_hotels(request, max_price_per_night)[:15]
    
    def _generate_fallback_hotels(self, request: HotelSearchRequest, max_price: float) -> List[Hotel]:
        """
        Generate realistic hotel data based on actual Indian hotel chains and properties
        with varied and realistic pricing
        """
        hotels = []
        
        # Real Indian hotel chains and properties with more realistic price ranges
        hotel_chains = {
            "luxury": [
                {"name": "Taj Palace", "base_price": 9500, "variance": 0.25, "rating": 4.7},
                {"name": "The Oberoi", "base_price": 13500, "variance": 0.20, "rating": 4.8},
                {"name": "ITC Grand", "base_price": 10200, "variance": 0.22, "rating": 4.6},
                {"name": "Leela Palace", "base_price": 12800, "variance": 0.18, "rating": 4.8},
                {"name": "JW Marriott", "base_price": 8200, "variance": 0.28, "rating": 4.6},
                {"name": "The Ritz-Carlton", "base_price": 15000, "variance": 0.20, "rating": 4.9},
            ],
            "premium": [
                {"name": "Hyatt Regency", "base_price": 6200, "variance": 0.30, "rating": 4.5},
                {"name": "Radisson Blu", "base_price": 5100, "variance": 0.35, "rating": 4.4},
                {"name": "Novotel", "base_price": 4600, "variance": 0.32, "rating": 4.3},
                {"name": "Holiday Inn", "base_price": 3900, "variance": 0.38, "rating": 4.2},
                {"name": "Crowne Plaza", "base_price": 5700, "variance": 0.28, "rating": 4.4},
                {"name": "Courtyard by Marriott", "base_price": 4800, "variance": 0.33, "rating": 4.3},
            ],
            "midrange": [
                {"name": "Lemon Tree Hotel", "base_price": 2800, "variance": 0.40, "rating": 4.0},
                {"name": "Ginger Hotel", "base_price": 2200, "variance": 0.45, "rating": 3.9},
                {"name": "Treebo Hotels", "base_price": 1950, "variance": 0.48, "rating": 3.8},
                {"name": "FabHotel", "base_price": 1650, "variance": 0.50, "rating": 3.7},
                {"name": "Bloom Hotel", "base_price": 2450, "variance": 0.42, "rating": 4.0},
                {"name": "Keys Hotels", "base_price": 3100, "variance": 0.38, "rating": 4.1},
            ],
            "budget": [
                {"name": "OYO Flagship", "base_price": 1350, "variance": 0.55, "rating": 3.5},
                {"name": "Collection O", "base_price": 1150, "variance": 0.60, "rating": 3.6},
                {"name": "Zostel", "base_price": 850, "variance": 0.35, "rating": 4.2},
                {"name": "GoStays", "base_price": 980, "variance": 0.58, "rating": 3.4},
                {"name": "Spot ON", "base_price": 1220, "variance": 0.52, "rating": 3.5},
                {"name": "Capital O", "base_price": 1450, "variance": 0.48, "rating": 3.7},
            ]
        }
        
        locations = {
            "goa": ["Calangute", "Baga Beach", "Anjuna", "Candolim", "Panjim"],
            "mumbai": ["Colaba", "Bandra", "Andheri", "Powai", "Lower Parel"],
            "delhi": ["Connaught Place", "Aerocity", "Karol Bagh", "Paharganj", "Dwarka"],
            "bangalore": ["MG Road", "Whitefield", "Indiranagar", "Koramangala", "Electronic City"],
            "bengaluru": ["MG Road", "Whitefield", "Indiranagar", "Koramangala", "Electronic City"],
            "chennai": ["T Nagar", "Anna Salai", "Egmore", "Mylapore", "OMR"],
            "jaipur": ["City Palace Area", "MI Road", "Bani Park", "Malviya Nagar", "Vaishali Nagar"],
            "vellore": ["Katpadi", "Fort Area", "Gandhi Nagar", "CMC Campus", "Sathuvachari"],
            "puducherry": ["White Town", "Beach Road", "Auroville", "French Quarter", "Promenade"],
            "pondicherry": ["White Town", "Beach Road", "Auroville", "French Quarter", "Promenade"],
            "default": ["City Center", "Downtown", "Near Station", "Airport Road", "Main Street"]
        }
        
        # Get locations for destination
        dest_key = request.destination.lower()
        dest_locations = locations.get(dest_key, locations["default"])
        
        # Determine hotel categories based on budget with better distribution
        all_hotels = []
        if max_price > 8000:
            # High budget - mix of luxury and premium
            all_hotels.extend(hotel_chains["luxury"] * 2)
            all_hotels.extend(hotel_chains["premium"] * 2)
            all_hotels.extend(hotel_chains["midrange"])
        elif max_price > 4000:
            # Medium-high budget - premium and midrange
            all_hotels.extend(hotel_chains["premium"] * 3)
            all_hotels.extend(hotel_chains["midrange"] * 2)
            all_hotels.extend(hotel_chains["budget"])
        elif max_price > 2000:
            # Medium budget - midrange focused
            all_hotels.extend(hotel_chains["midrange"] * 3)
            all_hotels.extend(hotel_chains["premium"])
            all_hotels.extend(hotel_chains["budget"] * 2)
        else:
            # Low budget - budget and economy midrange
            all_hotels.extend(hotel_chains["budget"] * 3)
            all_hotels.extend(hotel_chains["midrange"] * 2)
        
        # Shuffle for variety
        random.shuffle(all_hotels)
        
        amenities_pool = [
            ["Free WiFi", "Swimming Pool", "Gym", "Restaurant", "Room Service"],
            ["Free WiFi", "Parking", "Restaurant", "24/7 Front Desk"],
            ["Free WiFi", "Complimentary Breakfast", "AC Rooms", "TV"],
            ["WiFi", "Hot Water", "Clean Rooms", "Laundry Service"],
            ["Free WiFi", "Bar", "Spa", "Conference Room", "Airport Shuttle"],
            ["WiFi", "Rooftop Restaurant", "Gym", "Pool", "Concierge"],
        ]
        
        tags_mapping = {
            "luxury": "Luxury Pick",
            "premium": "Best Value",
            "midrange": "Family Friendly",
            "budget": "Budget Friendly"
        }
        
        # Destination price multipliers (some cities are more expensive)
        destination_multipliers = {
            "mumbai": 1.3,
            "delhi": 1.2,
            "bangalore": 1.25,
            "bengaluru": 1.25,
            "goa": 1.4,
            "jaipur": 0.9,
            "chennai": 1.1,
            "puducherry": 0.95,
            "pondicherry": 0.95,
            "vellore": 0.75,
            "default": 1.0
        }
        
        dest_multiplier = destination_multipliers.get(dest_key, destination_multipliers["default"])
        
        # Trip type multipliers
        trip_multipliers = {
            "luxurious": 1.35,
            "adventure": 1.0,
            "budget": 0.75,
            "family": 1.15,
            "romantic": 1.25,
            "business": 1.2
        }
        
        trip_multiplier = trip_multipliers.get(request.trip_type.lower(), 1.0)
        
        # Generate 10 hotels spanning the FULL price range from budget to max_price
        hotels_to_generate = min(10, len(all_hotels))
        
        # Calculate price distribution - from 25% to 100% of max budget
        min_price = max_price * 0.25
        
        self.logger.debug("Generating hotels with price range: %s to %s", f"₹{min_price:.0f}", f"₹{max_price:.0f}")
        
        for i in range(hotels_to_generate):
            hotel_data = all_hotels[i]
            
            # Distribute prices evenly across the range with added randomness
            # This ensures EVERY hotel has a different price
            position = i / max(hotels_to_generate - 1, 1)  # 0 to 1
            
            # Calculate base target price for this position
            target_price = min_price + (position * (max_price - min_price))
            
            # Add unique randomness to each hotel (±8% of its target)
            unique_variance = target_price * random.uniform(-0.08, 0.08)
            price = target_price + unique_variance
            
            # Add small random jitter to prevent identical prices
            price += random.randint(-50, 150)
            
            # Ensure price stays within bounds
            price = max(min_price, min(price, max_price))
            
            # Light rounding only - keeps prices distinct
            if price > 3000:
                price = round(price / 10) * 10  # Round to nearest 10
            else:
                price = round(price / 5) * 5  # Round to nearest 5
            
            self.logger.debug("Hotel %d: %s (position %.1f%%, target %s)", i+1, f"₹{price:.0f}", position*100, f"₹{target_price:.0f}")
            
            # Determine category based on position in price range
            price_ratio = (price - min_price) / (max_price - min_price)
            
            if price_ratio > 0.75:
                category = "luxury"
                rating = random.uniform(4.5, 4.9)
            elif price_ratio > 0.5:
                category = "premium"
                rating = random.uniform(4.0, 4.5)
            elif price_ratio > 0.3:
                category = "midrange"
                rating = random.uniform(3.7, 4.2)
            else:
                category = "budget"
                rating = random.uniform(3.4, 3.9)
            
            hotels.append(Hotel(
                id=f"hotel_{i+1}",
                name=f"{hotel_data['name']} {request.destination}",
                price=round(price, 0),
                rating=round(rating, 1),
                image=self._get_hotel_image(i),
                location=random.choice(dest_locations),
                amenities=random.choice(amenities_pool),
                description=f"Well-appointed {category} hotel in {request.destination}, perfect for {request.trip_type} travelers.",
                tag=tags_mapping[category]
            ))
        
        # Sort by price to show budget options first
        hotels.sort(key=lambda x: x.price)
        
        self.logger.debug("Generated %d hotels with prices", len(hotels))
        
        return hotels
    
    def _get_hotel_image(self, index: int) -> str:
        """
        Get hotel image URL - using stable image CDN with actual hotel photos
        """
        # Using picsum.photos as reliable fallback + verified hotel images
        hotel_images = [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",  # Luxury hotel
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",  # Hotel room
            "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800",  # Modern hotel
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",  # Resort pool
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",  # Hotel exterior
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",  # Hotel lobby
            "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",  # Beach resort
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",  # Hotel interior
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800",  # Boutique hotel
            "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800",  # Bedroom
            "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",  # Modern room
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",  # Hotel view
            "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",  # Luxury suite
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",  # Resort
            "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800",  # Hotel building
        ]
        return hotel_images[index % len(hotel_images)]


# Initialize agent instance
hotel_agent = HotelAgent()
