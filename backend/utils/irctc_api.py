"""
IRCTC API Integration via RapidAPI
Provides real Indian Railways train data
"""
import requests
from typing import List, Dict, Optional
from datetime import datetime, date
from config import settings
from functools import lru_cache
import hashlib
import logging

# Module logger
logger = logging.getLogger(__name__)


class IRCTCClient:
    """Client for IRCTC API via RapidAPI with caching"""
    
    def __init__(self):
        self.api_key = settings.rapidapi_key
        self.base_url = "https://irctc1.p.rapidapi.com"
        self.headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "irctc1.p.rapidapi.com"
        }
        self._cache = {}  # Simple in-memory cache
        
        if not self.api_key:
            logger.warning("RAPIDAPI_KEY not found in environment variables - using fallback train data")
        else:
            logger.info("RapidAPI Key loaded: %s...%s", self.api_key[:10], self.api_key[-5:])
    
    def search_trains(
        self, 
        from_station: str, 
        to_station: str, 
        travel_date: Optional[date] = None
    ) -> List[Dict]:
        """
        Search trains between two stations with caching
        
        Args:
            from_station: Source station code (e.g., "NDLS" for New Delhi)
            to_station: Destination station code (e.g., "BCT" for Mumbai Central)
            travel_date: Date of travel (optional, defaults to today)
        
        Returns:
            List of trains with details
        """
        # Create cache key
        if travel_date:
            date_str = travel_date.strftime("%Y-%m-%d")
        else:
            from datetime import timedelta
            date_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        cache_key = f"{from_station}_{to_station}_{date_str}"
        
        # Check cache first
        if cache_key in self._cache:
            logger.debug("Using cached train data: %s -> %s", from_station, to_station)
            return self._cache[cache_key]

        logger.debug("IRCTC API call: %s -> %s", from_station, to_station)
        
        if not self.api_key:
            logger.warning("No RAPIDAPI_KEY - using fallback train data")
            return self._get_fallback_trains(from_station, to_station)
        
        try:
            logger.debug("Date: %s", date_str)
            logger.debug("API Key: %s...%s", self.api_key[:10], (self.api_key[-5:] if len(self.api_key) > 15 else '***'))
            
            # IRCTC1 API endpoint: TrainsBetweenStations V3
            url = f"{self.base_url}/api/v3/trainBetweenStations"
            
            params = {
                "fromStationCode": from_station.upper(),
                "toStationCode": to_station.upper(),
                "dateOfJourney": date_str
            }
            
            logger.debug("Calling: %s", url)
            logger.debug("Params: %s", params)
            
            response = requests.get(
                url, 
                headers=self.headers, 
                params=params,
                timeout=10  # Reduced from 15 for faster timeout
            )
            
            logger.debug("Response status: %s", response.status_code)
            
            if response.status_code == 200:
                data = response.json()
                logger.debug("Response data keys: %s", (list(data.keys()) if data else 'empty'))
                
                # Check for API errors
                if 'errors' in data:
                    logger.warning("IRCTC API returned errors: %s", data['errors'])
                    return self._get_fallback_trains(from_station, to_station)
                
                trains = self._parse_train_response(data, to_station)
                logger.debug("Parsed %s trains", len(trains))
                
                # Cache the result
                self._cache[cache_key] = trains
                
                return trains
            elif response.status_code == 429:
                logger.warning("IRCTC API rate limit reached - using fallback data")
                return self._get_fallback_trains(from_station, to_station)
            elif response.status_code == 403:
                logger.error("IRCTC API: 403 Forbidden - Check API key subscription")
                logger.debug("Response: %s", response.text[:200])
                return self._get_fallback_trains(from_station, to_station)
            else:
                logger.error("IRCTC API error: %s", response.status_code)
                logger.debug("Response: %s", response.text[:200])
                return self._get_fallback_trains(from_station, to_station)
                
        except Exception as e:
            logger.exception("Error fetching train data: %s", e)
            return self._get_fallback_trains(from_station, to_station)
    
    def get_train_status(self, train_number: str, date: str = None) -> Optional[Dict]:
        """
        Get live running status of a train
        
        Args:
            train_number: Train number (e.g., "12301")
            date: Date in YYYY-MM-DD format (optional)
        
        Returns:
            Train status details or None
        """
        if not self.api_key:
            return None
        
        try:
            # IRCTC1 API endpoint: Get Train Live Status
            url = f"{self.base_url}/api/v1/getTrainLiveStatus"
            params = {"trainNo": train_number}
            if date:
                params["startDay"] = date
            
            response = requests.get(
                url,
                headers=self.headers,
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except Exception as e:
            logger.exception("Error fetching train status: %s", e)
            return None
    
    def check_pnr_status(self, pnr_number: str) -> Optional[Dict]:
        """
        Check PNR status
        
        Args:
            pnr_number: 10-digit PNR number
        
        Returns:
            PNR status details or None
        """
        if not self.api_key:
            return None
        
        try:
            # IRCTC1 API endpoint: Get PNR Status V3
            url = f"{self.base_url}/api/v3/getPNRStatus"
            params = {"pnrNumber": pnr_number}
            
            response = requests.get(
                url,
                headers=self.headers,
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except Exception as e:
            logger.exception("Error checking PNR status: %s", e)
            return None
    
    def _parse_train_response(self, data: Dict, to_station: str = None) -> List[Dict]:
        """Parse IRCTC1 API response into standardized format"""
        trains = []
        
        if not data:
            return trains
        
        # IRCTC1 API returns trains in 'data' field
        train_list = data.get('data', [])
        
        for train in train_list:
            try:
                # Extract train details from actual API response format
                train_number = str(train.get('train_number', 'N/A'))
                train_name = train.get('train_name', 'Unknown Train')
                
                # Get class types
                classes = train.get('class_type', [])
                
                trains.append({
                    'train_number': train_number,
                    'train_name': train_name,
                    'from_station': train.get('train_src', train.get('from', '')),
                    'to_station': train.get('train_dstn', train.get('to', '')),
                    'departure_time': train.get('from_std', train.get('from_sta', 'N/A')),
                    'arrival_time': train.get('to_sta', train.get('to_std', 'N/A')),
                    'duration': train.get('duration', 'N/A'),
                    'classes': classes if isinstance(classes, list) else [],
                    'run_days': train.get('run_days', 'Daily'),
                    'distance': train.get('distance', 0),
                    'train_type': train.get('train_type', ''),
                    'price_range': self._estimate_price(classes if isinstance(classes, list) else [])
                })
            except Exception as e:
                logger.exception("Error parsing train data: %s", e)
                continue
        
        return trains
    
    def _estimate_price(self, classes: List[str]) -> Dict[str, float]:
        """Estimate ticket prices based on available classes"""
        # Approximate Indian Railways pricing
        price_map = {
            '1A': 2500,  # First AC
            '2A': 1500,  # Second AC
            '3A': 900,   # Third AC
            'SL': 400,   # Sleeper
            '2S': 200,   # Second Sitting
            'CC': 1200,  # Chair Car
            'EC': 1800   # Executive Class
        }
        
        prices = {}
        for cls in classes:
            if cls in price_map:
                prices[cls] = price_map[cls]
        
        return prices
    
    def _get_fallback_trains(self, from_station: str, to_station: str) -> List[Dict]:
        """Fallback mock train data when API is unavailable"""
        # Common station pairs
        station_pairs = {
            ('NDLS', 'BCT'): [
                {
                    'train_number': '12951',
                    'train_name': 'Mumbai Rajdhani',
                    'from_station': 'NDLS',
                    'to_station': 'BCT',
                    'departure_time': '16:35',
                    'arrival_time': '08:35',
                    'duration': '16h 00m',
                    'classes': ['1A', '2A', '3A'],
                    'run_days': 'Daily',
                    'price_range': {'1A': 3500, '2A': 2100, '3A': 1450}
                },
                {
                    'train_number': '12137',
                    'train_name': 'Punjab Mail',
                    'from_station': 'NDLS',
                    'to_station': 'BCT',
                    'departure_time': '19:30',
                    'arrival_time': '14:25',
                    'duration': '18h 55m',
                    'classes': ['2A', '3A', 'SL'],
                    'run_days': 'Daily',
                    'price_range': {'2A': 1800, '3A': 1200, 'SL': 500}
                }
            ],
            ('DEL', 'BOM'): [
                {
                    'train_number': '12951',
                    'train_name': 'Mumbai Rajdhani',
                    'from_station': 'DEL',
                    'to_station': 'BOM',
                    'departure_time': '16:35',
                    'arrival_time': '08:35',
                    'duration': '16h 00m',
                    'classes': ['1A', '2A', '3A'],
                    'run_days': 'Daily',
                    'price_range': {'1A': 3500, '2A': 2100, '3A': 1450}
                }
            ]
        }
        
        # Try to find matching pair
        key = (from_station.upper(), to_station.upper())
        if key in station_pairs:
            return station_pairs[key]
        
        # Generic fallback
        return [
            {
                'train_number': '12301',
                'train_name': 'Rajdhani Express',
                'from_station': from_station.upper(),
                'to_station': to_station.upper(),
                'departure_time': '16:00',
                'arrival_time': '09:00',
                'duration': '17h 00m',
                'classes': ['1A', '2A', '3A'],
                'run_days': 'Daily',
                'price_range': {'1A': 3000, '2A': 1800, '3A': 1200}
            },
            {
                'train_number': '12345',
                'train_name': 'Express Train',
                'from_station': from_station.upper(),
                'to_station': to_station.upper(),
                'departure_time': '20:00',
                'arrival_time': '15:00',
                'duration': '19h 00m',
                'classes': ['2A', '3A', 'SL'],
                'run_days': 'Daily',
                'price_range': {'2A': 1500, '3A': 1000, 'SL': 450}
            }
        ]

# Singleton instance
irctc_client = IRCTCClient()


# Helper function for easy import
def get_trains(from_station: str, to_station: str, travel_date: Optional[date] = None):
    """
    Convenience function to search trains
    
    Example:
        trains = get_trains("NDLS", "BCT")  # Delhi to Mumbai
    """
    return irctc_client.search_trains(from_station, to_station, travel_date)


# Station code mapping for common cities
STATION_CODES = {
    # Delhi & NCR
    "delhi": "NDLS",
    "new delhi": "NDLS",
    "old delhi": "DLI",
    "hazrat nizamuddin": "NZM",
    "nizamuddin": "NZM",
    "anand vihar": "ANVT",
    "sarai rohilla": "DEE",
    
    # Mumbai & Region
    "mumbai": "CSTM",
    "bombay": "CSTM",
    "mumbai central": "BCT",
    "bandra": "BDTS",
    "lokmanya tilak": "LTT",
    "dadar": "DR",
    "thane": "TNA",
    
    # Bangalore & Karnataka
    "bangalore": "SBC",
    "bengaluru": "SBC",
    "bangalore city": "BNC",
    "yeshwantpur": "YPR",
    "mysore": "MYS",
    "mysuru": "MYS",
    "hubli": "UBL",
    "mangalore": "MAQ",
    "belgaum": "BGM",
    
    # Chennai & Tamil Nadu
    "chennai": "MAS",
    "madras": "MAS",
    "chennai egmore": "MS",
    "tambaram": "TBM",
    "coimbatore": "CBE",
    "madurai": "MDU",
    "trichy": "TPJ",
    "tiruchirappalli": "TPJ",
    "salem": "SA",
    "tirunelveli": "TEN",
    "vellore": "VLR",
    "katpadi": "KPD",
    "erode": "ED",
    "tirupati": "TPTY",
    "kanyakumari": "CAPE",
    
    # Kolkata & East
    "kolkata": "HWH",
    "calcutta": "HWH",
    "howrah": "HWH",
    "sealdah": "SDAH",
    "new jalpaiguri": "NJP",
    "jalpaiguri": "NJP",
    "patna": "PNBE",
    "guwahati": "GHY",
    "bhubaneswar": "BBS",
    "puri": "PURI",
    
    # Hyderabad & Telangana
    "hyderabad": "HYB",
    "secunderabad": "SC",
    "kacheguda": "KCG",
    "warangal": "WL",
    
    # Pune & Maharashtra
    "pune": "PUNE",
    "nagpur": "NGP",
    "aurangabad": "AWB",
    "nashik": "NK",
    "solapur": "SUR",
    
    # Ahmedabad & Gujarat
    "ahmedabad": "ADI",
    "surat": "ST",
    "vadodara": "BRC",
    "baroda": "BRC",
    "rajkot": "RJT",
    "bhavnagar": "BVC",
    
    # Jaipur & Rajasthan
    "jaipur": "JP",
    "jodhpur": "JU",
    "udaipur": "UDZ",
    "ajmer": "AII",
    "bikaner": "BKN",
    "kota": "KOTA",
    
    # Goa
    "goa": "MAO",
    "madgaon": "MAO",
    "vasco da gama": "VSG",
    "margao": "MAO",
    
    # Uttar Pradesh
    "lucknow": "LKO",
    "kanpur": "CNB",
    "varanasi": "BSB",
    "agra": "AGC",
    "allahabad": "PRYJ",
    "prayagraj": "PRYJ",
    "gorakhpur": "GKP",
    "meerut": "MTC",
    
    # Punjab & Haryana
    "amritsar": "ASR",
    "ludhiana": "LDH",
    "jalandhar": "JUC",
    "chandigarh": "CDG",
    "ambala": "UMB",
    
    # Madhya Pradesh
    "bhopal": "BPL",
    "indore": "INDB",
    "jabalpur": "JBP",
    "gwalior": "GWL",
    "ujjain": "UJN",
    
    # Kerala
    "thiruvananthapuram": "TVC",
    "trivandrum": "TVC",
    "kochi": "ERS",
    "cochin": "ERS",
    "ernakulam": "ERS",
    "kozhikode": "CLT",
    "calicut": "CLT",
    "thrissur": "TCR",
    "kannur": "CAN",
    
    # Andhra Pradesh
    "vijayawada": "BZA",
    "visakhapatnam": "VSKP",
    "vizag": "VSKP",
    "guntur": "GNT",
    "rajahmundry": "RJY",
    
    # Uttarakhand & Himachal
    "dehradun": "DDN",
    "haridwar": "HW",
    "rishikesh": "RKSH",
    "shimla": "SML",
    
    # Puducherry
    "pondicherry": "PDY",
    "puducherry": "PDY",
    
    # Odisha
    "cuttack": "CTC",
    "berhampur": "BAM",
    
    # Assam
    "dibrugarh": "DBRG",
    "jorhat": "JTTN",
    
    # Jammu & Kashmir
    "jammu": "JAT",
    "srinagar": "SINA"
}


def get_station_code(city_name: str) -> str:
    """
    Get station code for a city name
    
    Args:
        city_name: City name (e.g., "Mumbai", "Delhi")
    
    Returns:
        Station code (e.g., "BCT", "NDLS")
    """
    city_lower = city_name.lower().strip()
    return STATION_CODES.get(city_lower, city_name.upper()[:4])
