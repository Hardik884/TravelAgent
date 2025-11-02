"""
Amadeus API Integration for Real Flight and Hotel Data
Free tier: 10,000 API calls/month
Sign up at: https://developers.amadeus.com/register
"""

from amadeus import Client, ResponseError
from typing import List, Dict, Optional
from datetime import datetime
from config import settings
import logging

# Module logger
logger = logging.getLogger(__name__)

CURRENCY_TO_INR = {
    'EUR': 90.0,   # 1 EUR ≈ ₹90
    'USD': 83.0,   # 1 USD ≈ ₹83
    'GBP': 105.0,  # 1 GBP ≈ ₹105
    'INR': 1.0,
    'AED': 22.5,   # 1 AED ≈ ₹22.5
    'SGD': 62.0,   # 1 SGD ≈ ₹62
}

class AmadeusService:
    """
    Service class for Amadeus API integration
    Provides real flight and hotel data
    """
    
    def __init__(self):
        """Initialize Amadeus client with API credentials"""
        try:
            if not settings.amadeus_api_key or not settings.amadeus_api_secret:
                logger.warning("Amadeus credentials missing in .env file")
                self.client = None
                return
                
            self.client = Client(
                client_id=settings.amadeus_api_key,
                client_secret=settings.amadeus_api_secret
            )
            logger.info("Amadeus API client initialized successfully")
            logger.debug("Key: %s...", settings.amadeus_api_key[:10])
        except Exception as e:
            logger.exception("Amadeus API initialization failed: %s", e)
            logger.debug("Error type: %s", type(e).__name__)
            import traceback
            logger.debug(traceback.format_exc())
            self.client = None
    
    def _convert_to_inr(self, amount: float, currency: str) -> float:
        """
        Convert any currency to INR
        
        Args:
            amount: Price amount
            currency: Currency code (EUR, USD, GBP, INR)
            
        Returns:
            Price in INR
        """
        conversion_rate = CURRENCY_TO_INR.get(currency.upper(), 90.0)
        return round(amount * conversion_rate, 2)
    
    def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        adults: int = 1,
        max_price: Optional[int] = None,
        max_results: int = 3
    ) -> List[Dict]:
        """
        Search for flight offers using Amadeus Flight Offers Search API
        
        Args:
            origin: IATA code (e.g., 'DEL' for Delhi)
            destination: IATA code (e.g., 'BOM' for Mumbai)
            departure_date: Format 'YYYY-MM-DD'
            adults: Number of adult passengers
            max_price: Maximum price per person (optional)
            max_results: Maximum number of results (default 3 for speed)
            
        Returns:
            List of flight offers with price, airline, duration, etc.
        """
        if not self.client:
            return []
        
        try:
            # Build search parameters
            search_params = {
                'originLocationCode': origin,
                'destinationLocationCode': destination,
                'departureDate': departure_date,
                'adults': adults,
                'max': max_results,
                'currencyCode': 'INR',
                'nonStop': 'false',  
                'maxPrice': max_price if max_price else 50000  
            }
            
            # Call Amadeus API with timeout
            response = self.client.shopping.flight_offers_search.get(**search_params)
            
            # Parse and format results
            flights = []
            for offer in response.data[:max_results]:
                flight_data = self._parse_flight_offer(offer)
                if flight_data:  
                    flights.append(flight_data)
            
            if flights:
                logger.info("Successfully parsed %s flights from Amadeus", len(flights))
            else:
                logger.debug("No flights could be parsed from Amadeus response")
            
            return flights
            
        except ResponseError as error:
            logger.error("Amadeus API Error: %s", error)
            return []
        except Exception as e:
            logger.exception("Flight search error: %s", e)
            return []
    
    def _parse_flight_offer(self, offer: Dict) -> Optional[Dict]:
        """
        Parse Amadeus flight offer into simplified format
        
        Args:
            offer: Raw Amadeus flight offer data
            
        Returns:
            Formatted flight data with prices in INR, or None if parsing fails
        """
        try:
            # Validate structure
            if 'itineraries' not in offer or not offer['itineraries']:
                return None
            
            # Get first itinerary and first segment
            itinerary = offer['itineraries'][0]
            
            if 'segments' not in itinerary or not itinerary['segments']:
                return None
            
            segment = itinerary['segments'][0]
            
            # Extract price and currency (required fields)
            if 'price' not in offer or 'total' not in offer['price']:
                return None
            
            original_price = float(offer['price']['total'])
            original_currency = offer['price'].get('currency', 'EUR')
            
            # Convert to INR
            price_inr = self._convert_to_inr(original_price, original_currency)
            
            
            # Safely extract flight details with defaults
            flight_data = {
                'airline': segment.get('carrierCode', 'Unknown'),
                'flight_number': f"{segment.get('carrierCode', 'XX')}{segment.get('number', '000')}",
                'departure_time': segment.get('departure', {}).get('at', 'N/A'),
                'arrival_time': segment.get('arrival', {}).get('at', 'N/A'),
                'duration': itinerary.get('duration', 'N/A'),
                'price': price_inr,
                'currency': 'INR',
                'original_price': original_price,
                'original_currency': original_currency,
                'seats_available': offer.get('numberOfBookableSeats', 'N/A'),
                'cabin_class': segment.get('cabin', 'ECONOMY'),  # Default to ECONOMY if not provided
                'stops': len(itinerary['segments']) - 1,
                'is_estimate': True  
            }
            
            return flight_data
            
        except Exception as e:
            logger.exception("Error parsing flight offer: %s", e)
            return None
    
    def get_hotels_list(
        self,
        city_code: str,
        max_results: int = 10  
    ) -> List[Dict]:
        """
        Get list of real hotels from Amadeus (directory only, no pricing)
        
        Args:
            city_code: IATA city code (e.g., 'DEL' for Delhi)
            max_results: Maximum number of results (default 10 for speed)
            
        Returns:
            List of hotels with real names and locations (no pricing)
        """
        if not self.client:
            return []
        
        try:
            # Search for hotels by city 
            hotel_search_params = {
                'cityCode': city_code,
                'radius': 30,
                'radiusUnit': 'KM',
                'hotelSource': 'ALL'
            }
            
            hotels_response = self.client.reference_data.locations.hotels.by_city.get(
                **hotel_search_params
            )
            
            if not hotels_response.data:
                return []
            
            # Parse hotel directory data
            hotels = []
            for hotel_data in hotels_response.data[:max_results]:
                try:
                    hotel_info = {
                        'hotel_id': hotel_data.get('hotelId', 'N/A'),
                        'name': hotel_data.get('name', 'Unknown Hotel'),
                        'iata_code': hotel_data.get('iataCode', city_code),
                        'latitude': hotel_data.get('geoCode', {}).get('latitude'),
                        'longitude': hotel_data.get('geoCode', {}).get('longitude'),
                        'address': hotel_data.get('address', {}),
                        'distance': hotel_data.get('distance', {}).get('value'),
                        'distance_unit': hotel_data.get('distance', {}).get('unit', 'KM')
                    }
                    hotels.append(hotel_info)
                except Exception as e:
                    logger.exception("Error parsing hotel: %s", e)
                    continue
            
            if hotels:
                logger.info("Retrieved %s real hotel names from Amadeus", len(hotels))
            
            return hotels
            
        except ResponseError as error:
            logger.error("Amadeus Hotel Directory Error: %s", error)
            return []
        except Exception as e:
            logger.exception("Hotel directory search error: %s", e)
            return []
    
    def search_hotels(
        self,
        city_code: str,
        check_in: str,
        check_out: str,
        adults: int = 1,
        max_price: Optional[int] = None,
        max_results: int = 10
    ) -> List[Dict]:
        """
        Search for hotel offers using Amadeus Hotel Search API
        
        Args:
            city_code: IATA city code (e.g., 'DEL' for Delhi)
            check_in: Check-in date 'YYYY-MM-DD'
            check_out: Check-out date 'YYYY-MM-DD'
            adults: Number of adult guests
            max_price: Maximum price per night (optional)
            max_results: Maximum number of results
            
        Returns:
            List of hotel offers with name, price, rating, etc.
        """
        if not self.client:
            return []
        
        try:
            # Step 1: Search for hotels by city
            hotel_search_params = {
                'cityCode': city_code,
                'radius': 50,
                'radiusUnit': 'KM',
                'hotelSource': 'ALL'
            }
            
            # Get hotel list
            hotels_response = self.client.reference_data.locations.hotels.by_city.get(
                **hotel_search_params
            )
            
            if not hotels_response.data:
                return []
            
            # Extract hotel IDs (limit to max_results)
            hotel_ids = [hotel['hotelId'] for hotel in hotels_response.data[:max_results]]
            
            # Step 2: Get hotel offers with pricing
            offers_params = {
                'hotelIds': ','.join(hotel_ids),
                'checkInDate': check_in,
                'checkOutDate': check_out,
                'adults': adults,
                'roomQuantity': 1,
                'currency': 'INR'
            }
            
            if max_price:
                offers_params['priceRange'] = f'0-{max_price}'
            
            offers_response = self.client.shopping.hotel_offers_search.get(**offers_params)
            
            # Check if we got valid data
            if not offers_response or not hasattr(offers_response, 'data') or not offers_response.data:
                logger.debug("No hotel offers returned from Amadeus")
                return []
            
            # Parse and format results
            hotels = []
            for offer_data in offers_response.data[:max_results]:
                hotel_data = self._parse_hotel_offer(offer_data)
                if hotel_data:  # Only add if parsing succeeded
                    hotels.append(hotel_data)
            
            if hotels:
                logger.info("Successfully parsed %s hotels from Amadeus", len(hotels))
            else:
                logger.debug("No hotels could be parsed from Amadeus response")
            
            return hotels
            
        except ResponseError as error:
            logger.error("Amadeus Hotel API Error: %s", error)
            logger.error("   Status: %s", error.response.status_code if hasattr(error, 'response') else 'N/A')

            # Check for common test environment errors
            if hasattr(error, 'response') and error.response.status_code == 400:
                error_body = str(error.response.body) if hasattr(error.response, 'body') else ''
                if 'INVALID PROPERTY CODE' in error_body or 'UNABLE TO PROCESS' in error_body:
                    logger.warning("This is likely a test environment limitation")
                    logger.warning("Hotel offers require PRODUCTION API access")
                    logger.warning("Flights work fine in TEST, hotels need PROD")

            return []
        except Exception as e:
            logger.exception("Hotel search error: %s", e)
            return []
    
    def _parse_hotel_offer(self, offer: Dict) -> Optional[Dict]:
        """
        Parse Amadeus hotel offer into simplified format
        
        Args:
            offer: Raw Amadeus hotel offer data
            
        Returns:
            Formatted hotel data with prices in INR, or None if parsing fails
        """
        try:
            # Safely extract hotel data
            hotel = offer.get('hotel')
            if not hotel:
                return None
            
            # Safely extract offers
            offers_list = offer.get('offers', [])
            if not offers_list or len(offers_list) == 0:
                return None
            
            first_offer = offers_list[0]
            
            # Safely extract price
            price_data = first_offer.get('price', {})
            if not price_data:
                return None
            
            original_price = float(price_data.get('total', 0))
            if original_price == 0:
                return None
            
            original_currency = price_data.get('currency', 'EUR')
            
            # Convert to INR
            price_inr = self._convert_to_inr(original_price, original_currency)
            
            # Safely extract room data
            room_data = first_offer.get('room', {})
            room_type_est = room_data.get('typeEstimated', {})
            room_desc = room_data.get('description', {})
            
            hotel_data = {
                'hotel_id': hotel.get('hotelId', 'N/A'),
                'name': hotel.get('name', 'Unknown Hotel'),
                'rating': hotel.get('rating', 'N/A'),
                'price_per_night': price_inr,
                'currency': 'INR',
                'original_price': original_price,
                'original_currency': original_currency,
                'room_type': room_type_est.get('category', 'Standard'),
                'description': room_desc.get('text', '') if room_desc else '',
                'amenities': hotel.get('amenities', []),
                'location': {
                    'latitude': hotel.get('latitude'),
                    'longitude': hotel.get('longitude')
                }
            }
            
            return hotel_data
            
        except Exception as e:
            logger.exception("Error parsing hotel offer: %s", e)
            return None
    
    def get_city_code(self, city_name: str) -> Optional[str]:
        """
        Get IATA city code from city name
        
        Args:
            city_name: Name of the city
            
        Returns:
            IATA code or None
        """
        # Common Indian city codes
        city_codes = {
            'delhi': 'DEL',
            'new delhi': 'DEL',
            'mumbai': 'BOM',
            'bangalore': 'BLR',
            'bengaluru': 'BLR',
            'chennai': 'MAA',
            'kolkata': 'CCU',
            'hyderabad': 'HYD',
            'pune': 'PNQ',
            'ahmedabad': 'AMD',
            'jaipur': 'JAI',
            'goa': 'GOI',
            'kochi': 'COK',
            'cochin': 'COK',
            'lucknow': 'LKO',
            'thiruvananthapuram': 'TRV',
            'trivandrum': 'TRV',
            'chandigarh': 'IXC',
            'indore': 'IDR',
            'bhubaneswar': 'BBI',
            'raipur': 'RPR',
            'ranchi': 'IXR',
            'patna': 'PAT',
            'varanasi': 'VNS',
            'banaras': 'VNS',
            'agra': 'AGR',
            'srinagar': 'SXR',
            'amritsar': 'ATQ',
            'guwahati': 'GAU',
            'mangalore': 'IXE',
            'vijayawada': 'VGA',
            'coimbatore': 'CJB',
            'madurai': 'IXM',
            'visakhapatnam': 'VTZ',
            'vizag': 'VTZ',
            'nagpur': 'NAG',
            'udaipur': 'UDR',
            'jodhpur': 'JDH',
            'shimla': 'SLV',
            'manali': 'KUU',
            'leh': 'IXL',
            'port blair': 'IXZ',
            'imphal': 'IMF',
            'aizawl': 'AJL',
            'pondicherry': 'PNY',
            'puducherry': 'PNY',
            # Hill stations and tourist destinations
            'dehradun': 'DED',
            'mussoorie': 'DED',  # Nearest airport is Dehradun
            'rishikesh': 'DED',  # Nearest airport is Dehradun
            'haridwar': 'DED',  # Nearest airport is Dehradun
            'nainital': 'PGH',  # Pantnagar airport
            'darjeeling': 'IXB',  # Bagdogra airport
            'gangtok': 'IXB',  # Bagdogra airport
            'ooty': 'CJB',  # Coimbatore airport
            'kodaikanal': 'IXM',  # Madurai airport
            'munnar': 'COK',  # Kochi airport
            'mcleodganj': 'DHM',  # Dharamshala airport
            'dharamshala': 'DHM',
            # Beach destinations
            'andaman': 'IXZ',
            'varkala': 'TRV',
            'kovalam': 'TRV',
            'alleppey': 'COK',
            'alappuzha': 'COK',
            # Pilgrimage sites
            'tirupati': 'TIR',
            'shirdi': 'SAG',  # Shirdi airport
            'puri': 'BBI',  # Bhubaneswar airport
            'dwarka': 'AMD',  # Ahmedabad airport
            'ajmer': 'KQH',  # Kishangarh airport
            'mathura': 'AGR',  # Agra airport
            'vrindavan': 'AGR',
            # Other major cities
            'surat': 'STV',
            'rajkot': 'RAJ',
            'vadodara': 'BDQ',
            'baroda': 'BDQ',
            'mysore': 'MYQ',
            'mysuru': 'MYQ',
            'aurangabad': 'IXU',
            'siliguri': 'IXB',
            'gwalior': 'GWL',
            'bhopal': 'BHO',
            'jabalpur': 'JLR',
            'jammu': 'IXJ',
            'dehri': 'GAY',  # Gaya airport
            'bodh gaya': 'GAY',
        }
        
        city_lower = city_name.lower().strip()
        return city_codes.get(city_lower)


# Singleton instance
amadeus_service = AmadeusService()
