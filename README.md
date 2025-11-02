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
# Travel Agent AI

A full-stack travel planning application that combines a FastAPI backend with a React + TypeScript frontend.

This repo contains a multi-agent system (budget, hotels, transport, activities) that helps generate budgets, recommend hotels and transport options, and produce day-by-day itineraries.

If you just want to run the project quickly, see `SETUP_GUIDE.md` for concise, platform-specific steps.

## Highlights
- AI-assisted budget allocation and itinerary generation
- Real (optional) integrations: Amadeus (flights/hotels) and IRCTC (trains)
- Responsive React + Tailwind frontend with glassmorphism UI components
- FastAPI backend with MongoDB trip persistence

## Quick links
-- Quickstart (Windows PowerShell): `SETUP_GUIDE.md`
- API docs (after backend starts): `http://localhost:8000/docs`

## Run locally (short)
1. Backend: create a virtualenv, install requirements and run Uvicorn (see `SETUP_GUIDE.md`)
2. Frontend: `npm install` and `npm run dev`

See `SETUP_GUIDE.md` for copy-paste PowerShell steps.

## Project structure

Frontend (Vite + React + TypeScript)
```
src/
├── components/     # Reusable UI components
├── pages/          # Page-level components (Home, TripPlanner, Summary, etc.)
├── utils/          # API client, mock data
└── index.css       # Tailwind + global styles
```

Backend (FastAPI + agents)
```
backend/
├── agents/         # AI agent implementations (budget, hotel, transport, activities)
├── utils/          # API helpers (IRCTC, Amadeus integration helpers)
├── main.py         # FastAPI application and endpoints
├── db.py           # MongoDB connection and helpers
└── README.md       # Backend-specific instructions
```

## Environment variables
Create a `.env` in `backend/` (do not commit it). Add required variables listed in `backend/.env.example`.

Typical variables:
- `GOOGLE_AI_API_KEY` — required for AI-powered features (use your own key/service)
- `MONGODB_URI` — MongoDB connection string (local or Atlas)
- `RAPIDAPI_KEY` — optional (for IRCTC train data)
- `AMADEUS_API_KEY` / `AMADEUS_API_SECRET` — optional (for Amadeus production hotel offers)

Notes:
- Do NOT commit real API keys. `.gitignore` already includes `.env` and common venv/node ignores.

## What changed in the cleanup
- Removed noisy debug prints and retired one-off debug scripts.
- Replaced ad-hoc prints with structured logging (backend) and removed console.debug logs from the frontend.
- Added `QUICKSTART.md` with platform-specific steps and a short checklist before pushing to GitHub.

## Next steps / contribution ideas
- Add CI (GitHub Actions) for linting and type-checks
- Add tests for backend endpoints and basic frontend unit tests
- Add PDF export of itineraries and user authentication

## Troubleshooting
- Backend won't start: activate backend virtualenv and ensure `backend/.env` contains required vars and `MONGODB_URI` is reachable.
- Frontend errors: run `npm run typecheck` and `npm run lint` to locate TypeScript issues.

---

License: MIT

