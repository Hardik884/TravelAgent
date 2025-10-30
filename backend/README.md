# Travel Agent AI Backend

A multi-agent AI system for intelligent travel planning built with FastAPI.

## Features

- **Budget Agent**: Intelligently divides budget based on trip type (luxurious, adventurous, family, budget, cultural)
- **Hotel Agent**: Searches and recommends hotels using AI-powered generation
- **Transport Agent**: Finds flights, trains, buses, and cab options with real-time pricing
- **Activities Agent**: Generates personalized day-by-day itineraries

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

5. Add your API keys to `.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
AMADEUS_API_KEY=your_amadeus_api_key_here (optional)
AMADEUS_API_SECRET=your_amadeus_api_secret_here (optional)
RAPIDAPI_KEY=your_rapidapi_key_here (optional)
```

## Running the Server

```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Budget Analysis
`POST /api/budget/analyze`
- Analyzes budget and provides intelligent allocation

### Hotel Search
`POST /api/hotels/search`
- Searches for hotels based on criteria

### Transport Search
`POST /api/transport/search`
- Finds flight, train, bus, and cab options

### Itinerary Generation
`POST /api/itinerary/generate`
- Generates day-by-day activity plans

## Project Structure

```
backend/
├── main.py                 # FastAPI application
├── config.py              # Configuration and settings
├── requirements.txt       # Python dependencies
├── .env.example          # Example environment variables
├── models/
│   └── schemas.py        # Pydantic models
└── agents/
    ├── budget_agent.py    # Budget allocation agent
    ├── hotel_agent.py     # Hotel search agent
    ├── transport_agent.py # Transport options agent
    └── activities_agent.py # Itinerary generation agent
```

## Environment Variables

- `OPENAI_API_KEY`: Required for AI-powered features
- `AMADEUS_API_KEY`: Optional, for real flight data
- `AMADEUS_API_SECRET`: Optional, for real flight data
- `RAPIDAPI_KEY`: Optional, for additional APIs
