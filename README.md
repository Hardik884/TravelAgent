# 🌍 Travel Agent AI - AI-Powered Trip Planning System

An intelligent, full-stack travel planning application powered by multi-agent AI system. Plan your perfect trip with AI-assisted budget allocation, hotel recommendations, transport options, and personalized itineraries.

![Tech Stack](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI-green)
![AI](https://img.shields.io/badge/AI-Google%20Gemini%20(FREE)-purple)

## ✨ Features

### 🤖 AI Agents
1. **Budget Agent** - Smart budget allocation based on trip type
2. **Hotel Agent** - AI-generated hotel recommendations (100+ options)
3. **Transport Agent** - Multi-modal transport search (flights, trains, buses, cabs)
4. **Activities Agent** - Personalized day-by-day itinerary generation

### 🎯 Key Capabilities
- ✅ Intelligent budget distribution across categories
- ✅ Trip type customization (Luxurious, Adventurous, Family, Budget, Cultural)
- ✅ Real-time AI-powered recommendations
- ✅ Comprehensive transport options comparison
- ✅ Automated itinerary generation with cost tracking
- ✅ Beautiful, responsive UI with glassmorphism design
- ✅ Complete trip summary and planning

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Google AI Studio API Key (FREE - No credit card needed!)

### Installation

1. **Clone the repository**
```bash
cd "TravelAgent (1)"
```

2. **Setup Backend**
```powershell
# Run the backend setup script
.\start-backend.ps1
```

3. **Setup Frontend** (in new terminal)
```powershell
# Run the frontend setup script
.\start-frontend.ps1
```

4. **Configure API Key**
Get your FREE Google AI Studio API key:
- Go to https://makersuite.google.com/app/apikey
- Sign in with Google account
- Create API key
- Edit `backend\.env` and add:
```
GOOGLE_AI_API_KEY=AIzaSy...your-actual-key
```

**See [GOOGLE_AI_SETUP.md](GOOGLE_AI_SETUP.md) for detailed instructions**

5. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📖 Usage Guide

### Step 1: Trip Planning
1. Navigate to "Trip Planner"
2. Select your trip type
3. Enter destination and dates
4. Set budget and travelers
5. Get AI-powered budget breakdown

### Step 2: Hotel Selection
- Browse 100 AI-generated hotels
- Filter by price, rating, location
- View detailed amenities
- Select your preferred stay

### Step 3: Transport Options
- Compare flights, trains, buses, cabs
- View pricing and duration
- Get AI recommendations
- Select best option

### Step 4: Itinerary
- View personalized day-by-day plan
- See activity costs and timings
- Get optimization tips
- Regenerate for variations

### Step 5: Summary
- Review complete trip plan
- See total costs breakdown
- Download trip details (coming soon)

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── context/        # State management
├── types/          # TypeScript definitions
└── utils/          # API client & utilities
```

### Backend (FastAPI + OpenAI)
```
backend/
├── agents/         # AI agent implementations
│   ├── budget_agent.py
│   ├── hotel_agent.py
│   ├── transport_agent.py
│   └── activities_agent.py
├── models/         # Pydantic schemas
├── main.py         # FastAPI application
└── config.py       # Configuration
```

## 🔌 API Endpoints

### Budget Analysis
```http
POST /api/budget/analyze
Content-Type: application/json

{
  "trip_type": "luxurious",
  "destination": "Goa",
  "start_date": "2025-12-01",
  "end_date": "2025-12-05",
  "budget": 50000,
  "adults": 2,
  "children": 0
}
```

### Hotel Search
```http
POST /api/hotels/search
Content-Type: application/json

{
  "destination": "Goa",
  "check_in": "2025-12-01",
  "check_out": "2025-12-05",
  "adults": 2,
  "max_price": 5000,
  "trip_type": "luxurious"
}
```

### Transport Search
```http
POST /api/transport/search
Content-Type: application/json

{
  "origin": "Mumbai",
  "destination": "Goa",
  "travel_date": "2025-12-01",
  "adults": 2,
  "budget_allocation": 12000
}
```

### Itinerary Generation
```http
POST /api/itinerary/generate
Content-Type: application/json

{
  "destination": "Goa",
  "start_date": "2025-12-01",
  "end_date": "2025-12-05",
  "trip_type": "luxurious",
  "budget_allocation": 10000
}
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Axios** - HTTP client

### Backend
- **FastAPI** - Web framework
- **Google Gemini (FREE)** - AI capabilities
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server
- **Python 3.9+** - Programming language

## 🎨 Design Features
- Glassmorphism UI design
- Smooth animations and transitions
- Responsive layout (mobile-friendly)
- Dark theme optimized
- Gradient backgrounds
- Interactive components

## 🔮 Future Enhancements
- [ ] Real flight API integration (Amadeus/Skyscanner)
- [ ] Actual hotel booking via APIs
- [ ] PDF itinerary export
- [ ] User authentication & profiles
- [ ] Save and share trips
- [ ] Multi-language support
- [ ] Weather integration
- [ ] Currency conversion
- [ ] Review and rating system
- [ ] Social sharing features

## 📝 Environment Variables

### Backend (.env)
```env
GOOGLE_AI_API_KEY=your_google_ai_studio_api_key
```

**Get your FREE API key:** https://makersuite.google.com/app/apikey

**No credit card required!** Perfect for college projects and testing.

## 🐛 Troubleshooting

### Backend Issues
- **Import errors**: Activate virtual environment
- **API errors**: Check OpenAI API key validity
- **Port conflicts**: Ensure port 8000 is free

### Frontend Issues
- **Connection errors**: Verify backend is running
- **Build errors**: Clear node_modules and reinstall
- **CORS errors**: Check backend CORS settings

### Performance
- AI requests take 5-30 seconds
- Hotel generation: ~10-15 seconds
- Itinerary generation: ~15-30 seconds
- Be patient with AI processing

## 📄 License
MIT License - feel free to use for personal or commercial projects

## 🤝 Contributing
Contributions welcome! Please feel free to submit issues and pull requests.

## 📧 Support
- Check `/docs` endpoint for API documentation
- Review console logs for debugging
- Check network tab for API responses

## 🙏 Acknowledgments
- Google AI Studio for free Gemini API
- React & FastAPI communities
- All open-source contributors

---

**Built with ❤️ using FREE Google Gemini AI**

For detailed setup instructions, see [GOOGLE_AI_SETUP.md](GOOGLE_AI_SETUP.md)
For quick start guide, see [QUICKSTART.md](QUICKSTART.md)
