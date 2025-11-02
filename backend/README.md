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
MONGODB_URI=mongodb://localhost:27017 (or your MongoDB Atlas connection string)
```

## MongoDB Setup

This application uses MongoDB to store trip history.

### Local MongoDB (Development)

1. Install MongoDB Community Edition:
   - Windows: Download from https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: Follow instructions at https://docs.mongodb.com/manual/administration/install-on-linux/

2. Start MongoDB service:
   - Windows: MongoDB should start automatically as a service
   - Mac/Linux: `brew services start mongodb-community` or `sudo systemctl start mongod`

3. Verify MongoDB is running:
   ```bash
   mongosh
   ```
   You should see a MongoDB shell prompt.

### MongoDB Atlas (Production)

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Add a database user with read/write permissions
4. Whitelist your IP address (or 0.0.0.0/0 for development)
5. Get your connection string and add it to `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/travel_agent?retryWrites=true&w=majority
   ```

### Database Configuration

The application will automatically:
- Create a database named `travel_agent`
- Create a collection named `trips`
- Create indexes for efficient querying

No manual database setup is required!

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

### Trip History
`POST /api/trips`
- Saves a complete trip to the database

`GET /api/trips?user_id={user_id}&page={page}&limit={limit}`
- Lists all saved trips for a user (paginated)

`GET /api/trips/{trip_id}`
- Retrieves a single trip by ID

`DELETE /api/trips/{trip_id}`
- Deletes a trip by ID

## Project Structure

```
backend/
├── main.py                 # FastAPI application
├── config.py              # Configuration and settings
├── db.py                  # MongoDB connection management
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
- `MONGODB_URI`: MongoDB connection string (default: mongodb://localhost:27017)
- `MONGODB_DB`: Database name (default: travel_agent)
