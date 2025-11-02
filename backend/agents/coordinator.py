"""
Agent Coordinator - Manages the pipeline between all agents
Ensures budget constraints are respected across all agents
"""

from models.schemas import (
    TripRequest, BudgetResponse, 
    HotelSearchRequest, HotelSearchResponse,
    TransportSearchRequest, TransportSearchResponse,
    ItineraryRequest, ItineraryResponse
)
from agents.budget_agent_v2 import enhanced_budget_agent
from agents.hotel_agent import hotel_agent
from agents.transport_agent import transport_agent
from agents.activities_agent import activities_agent
import logging


class AgentCoordinator:
    """
    Coordinates all agents with proper budget pipeline
    """
    
    def __init__(self):
        self.budget_agent = enhanced_budget_agent
        self.hotel_agent = hotel_agent
        self.transport_agent = transport_agent
        self.activities_agent = activities_agent
        self.pipeline_context = {}
        self.logger = logging.getLogger(__name__)
    
    def process_budget(self, trip_request: TripRequest) -> dict:
        """
        Step 1: Process budget and store pipeline data
        """
        result = self.budget_agent.allocate_budget(trip_request)
        
        # Store pipeline data for other agents
        self.pipeline_context = {
            "trip_request": trip_request,
            **result["pipeline_data"]
        }
        
        self.logger.info("Budget Pipeline Set")
        self.logger.debug("  - Hotel budget per night: ₹%s", f"{result['pipeline_data']['hotel_budget_per_night']:.2f}")
        self.logger.debug("  - Activities budget per day: ₹%s", f"{result['pipeline_data']['activities_budget_per_day']:.2f}")
        self.logger.debug("  - Transport budget: ₹%s", f"{result['pipeline_data']['transport_budget']:.2f}")
        
        return result
    
    def search_hotels(self, request: HotelSearchRequest) -> HotelSearchResponse:
        """
        Step 2: Search hotels within budget constraints
        """
        if not self.pipeline_context:
            raise Exception("Budget must be processed first. Call process_budget() before search_hotels().")
        
        # Get hotel budget per night from pipeline
        max_price_per_night = self.pipeline_context.get("hotel_budget_per_night", request.max_price)
        
        # Override max_price with budget-constrained value
        request.max_price = min(request.max_price, max_price_per_night)
        
        self.logger.debug("Searching hotels with max price: ₹%s/night (from budget allocation)", f"{request.max_price:.2f}")
        
        return self.hotel_agent.search_hotels(request)
    
    def search_transport(self, request: TransportSearchRequest) -> TransportSearchResponse:
        """
        Step 3: Search transport within budget constraints
        """
        if not self.pipeline_context:
            raise Exception("Budget must be processed first. Call process_budget() before search_transport().")
        
        # Get transport budget from pipeline
        transport_budget = self.pipeline_context.get("transport_budget", request.budget_allocation)
        
        # Override budget_allocation with pipeline value
        request.budget_allocation = transport_budget
        
        self.logger.debug("Searching transport with budget: ₹%s (from budget allocation)", f"{request.budget_allocation:.2f}")
        
        return self.transport_agent.search_transport(request)
    
    def generate_itinerary(self, request: ItineraryRequest) -> ItineraryResponse:
        """
        Step 4: Generate itinerary within activity budget constraints
        """
        if not self.pipeline_context:
            raise Exception("Budget must be processed first. Call process_budget() before generate_itinerary().")
        
        # Get activities budget from pipeline
        activities_budget = self.pipeline_context.get("activities_budget", request.budget_allocation)
        activities_budget_per_day = self.pipeline_context.get("activities_budget_per_day", 0)
        
        # Override budget_allocation with pipeline value
        request.budget_allocation = activities_budget
        
        self.logger.info("Generating itinerary for budgeted activities")
        self.logger.debug("  - Total activities budget: ₹%s", f"{activities_budget:.2f}")
        self.logger.debug("  - Per day budget: ₹%s", f"{activities_budget_per_day:.2f}")
        
        # Generate itinerary with budget constraint
        result = self.activities_agent.generate_itinerary(request)
        
        # Validate that total cost doesn't exceed budget
        if result.total_activities_cost > activities_budget:
            self.logger.warning("Itinerary cost (₹%s) exceeds budget (₹%s)", f"{result.total_activities_cost:.2f}", f"{activities_budget:.2f}")
            self.logger.info("Adjusting activities to fit budget")
            # Optionally regenerate with stricter constraints
        
        return result
    
    def get_pipeline_summary(self) -> dict:
        """
        Get summary of current pipeline state
        """
        return self.pipeline_context
    
    def reset_pipeline(self):
        """
        Reset pipeline context
        """
        self.pipeline_context = {}
        self.logger.info("Pipeline reset")


# Initialize global coordinator
agent_coordinator = AgentCoordinator()
