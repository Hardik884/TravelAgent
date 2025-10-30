import google.generativeai as genai
from typing import List
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
            }
        )
        self.rapidapi_key = getattr(settings, 'rapidapi_key', None)
        
        if self.rapidapi_key:
            print(f"🔑 RapidAPI Key loaded: {self.rapidapi_key[:10]}...{self.rapidapi_key[-5:]}")
        else:
            print("⚠️ No RapidAPI key found in settings")
    
    def search_hotels(self, request: HotelSearchRequest) -> HotelSearchResponse:
        """
        """
        # Try to get real hotels from Booking.com API
        if self.rapidapi_key:
            try:
                hotels = self._search_real_hotels(request)
                if hotels and len(hotels) > 0:
                    print(f"✅ Retrieved {len(hotels)} REAL hotels from Booking.com API")
                    return HotelSearchResponse(
                        hotels=hotels,
                        total_count=len(hotels)
                    )
            except Exception as e:
                print(f"⚠️ Real API failed: {e}")
        else:
            print("ℹ️ No RapidAPI key found. Add RAPIDAPI_KEY to .env for REAL hotel data")
        
        # Fallback to realistic data
        hotels = self._generate_fallback_hotels(request, 
                                                request.max_price / max((request.check_out - request.check_in).days, 1))
        
        return HotelSearchResponse(
            hotels=hotels,
            total_count=len(hotels)
        )
    
    def _search_real_hotels(self, request: HotelSearchRequest) -> List[Hotel]:
        """
        """
        
        # Step 1: Search for destination
        search_url = "https://booking-com.p.rapidapi.com/v1/hotels/locations"
        
        clean_destination = request.destination.strip()
        
        print(f"🔍 Searching for destination: {clean_destination}")
        print(f"🔑 Using API key: {self.rapidapi_key[:10]}...{self.rapidapi_key[-5:]}")
        
        search_params = {
            "name": clean_destination,
            "locale": "en-gb"
        }
        search_headers = {
            "X-RapidAPI-Key": self.rapidapi_key,
            "X-RapidAPI-Host": "booking-com.p.rapidapi.com"
        }
        
        try:
            print(f"📡 Making API call to: {search_url}")
            search_response = requests.get(search_url, headers=search_headers, params=search_params, timeout=10)
            print(f"📥 Response status: {search_response.status_code}")
            search_response.raise_for_status()
            locations = search_response.json()
            print(f"✅ Found {len(locations)} locations")
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
                print(f"Error parsing hotel {idx}: {e}")
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
                print("No valid response from AI, using fallback")
                return self._generate_fallback_hotels(request, max_price_per_night)[:15]
            
            content = response.text.strip()
            
            # Clean markdown
            content = content.replace("```json", "").replace("```", "").strip()
            
            # Extract JSON array
            if '[' in content and ']' in content:
                start = content.index('[')
                end = content.rindex(']') + 1
                content = content[start:end]
            
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
                    print(f"Error parsing hotel {idx}: {e}")
                    continue
            
            # If AI generated fewer than 10 hotels, pad with fallback
            if len(hotels) < 10:
                print(f"Only got {len(hotels)} hotels from AI, adding fallback hotels")
                fallback_hotels = self._generate_fallback_hotels(request, max_price_per_night)
                hotels.extend(fallback_hotels[:(15-len(hotels))])
            
            return hotels[:15]  # Return 15 hotels for faster loading
            
        except Exception as e:
            print(f"Error generating hotels with AI: {e}")
            return self._generate_fallback_hotels(request, max_price_per_night)[:15]
    
    def _generate_fallback_hotels(self, request: HotelSearchRequest, max_price: float) -> List[Hotel]:
        """
        Generate realistic hotel data based on actual Indian hotel chains and properties
        """
        hotels = []
        
        # Real Indian hotel chains and properties
        hotel_chains = {
            "luxury": [
                {"name": "Taj Palace", "base_price": 8000, "rating": 4.7},
                {"name": "The Oberoi", "base_price": 12000, "rating": 4.8},
                {"name": "ITC Grand", "base_price": 9000, "rating": 4.6},
                {"name": "Leela Palace", "base_price": 11000, "rating": 4.8},
                {"name": "JW Marriott", "base_price": 7500, "rating": 4.6},
            ],
            "premium": [
                {"name": "Hyatt Regency", "base_price": 5500, "rating": 4.5},
                {"name": "Radisson Blu", "base_price": 4500, "rating": 4.4},
                {"name": "Novotel", "base_price": 4000, "rating": 4.3},
                {"name": "Holiday Inn", "base_price": 3500, "rating": 4.2},
                {"name": "Crowne Plaza", "base_price": 5000, "rating": 4.4},
            ],
            "midrange": [
                {"name": "Lemon Tree Hotel", "base_price": 2500, "rating": 4.0},
                {"name": "Ginger Hotel", "base_price": 2000, "rating": 3.9},
                {"name": "Treebo Hotels", "base_price": 1800, "rating": 3.8},
                {"name": "FabHotel", "base_price": 1500, "rating": 3.7},
                {"name": "Bloom Hotel", "base_price": 2200, "rating": 4.0},
            ],
            "budget": [
                {"name": "OYO Flagship", "base_price": 1200, "rating": 3.5},
                {"name": "Collection O", "base_price": 1000, "rating": 3.6},
                {"name": "Zostel", "base_price": 800, "rating": 4.2},
                {"name": "GoStays", "base_price": 900, "rating": 3.4},
                {"name": "Spot ON", "base_price": 1100, "rating": 3.5},
            ]
        }
        
        locations = {
            "goa": ["Calangute", "Baga Beach", "Anjuna", "Candolim", "Panjim"],
            "mumbai": ["Colaba", "Bandra", "Andheri", "Powai", "Lower Parel"],
            "delhi": ["Connaught Place", "Aerocity", "Karol Bagh", "Paharganj", "Dwarka"],
            "bangalore": ["MG Road", "Whitefield", "Indiranagar", "Koramangala", "Electronic City"],
            "chennai": ["T Nagar", "Anna Salai", "Egmore", "Mylapore", "OMR"],
            "jaipur": ["City Palace Area", "MI Road", "Bani Park", "Malviya Nagar", "Vaishali Nagar"],
            "default": ["City Center", "Downtown", "Near Station", "Airport Road", "Main Street"]
        }
        
        # Get locations for destination
        dest_key = request.destination.lower()
        dest_locations = locations.get(dest_key, locations["default"])
        
        # Determine hotel categories based on budget
        all_hotels = []
        if max_price > 8000:
            all_hotels.extend(hotel_chains["luxury"] * 2)
            all_hotels.extend(hotel_chains["premium"])
        elif max_price > 4000:
            all_hotels.extend(hotel_chains["premium"] * 2)
            all_hotels.extend(hotel_chains["midrange"])
        elif max_price > 1500:
            all_hotels.extend(hotel_chains["midrange"] * 2)
            all_hotels.extend(hotel_chains["budget"])
        else:
            all_hotels.extend(hotel_chains["budget"] * 2)
            all_hotels.extend(hotel_chains["midrange"])
        
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
        
        for i in range(min(15, len(all_hotels))):
            hotel_data = all_hotels[i]
            
            # Adjust price based on destination and randomness
            price = hotel_data["base_price"] * random.uniform(0.8, 1.2)
            
            # Ensure within budget
            if price > max_price * 1.2:
                price = max_price * random.uniform(0.7, 0.9)
            
            # Determine category
            category = "budget"
            if price > 8000:
                category = "luxury"
            elif price > 4000:
                category = "premium"
            elif price > 1500:
                category = "midrange"
            
            hotels.append(Hotel(
                id=f"hotel_{i+1}",
                name=f"{hotel_data['name']} {request.destination}",
                price=round(price, 0),
                rating=hotel_data["rating"] + random.uniform(-0.2, 0.2),
                image=self._get_hotel_image(i),
                location=random.choice(dest_locations),
                amenities=random.choice(amenities_pool),
                description=f"Well-appointed {category} hotel in {request.destination}, perfect for {request.trip_type} travelers.",
                tag=tags_mapping[category]
            ))
        
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
