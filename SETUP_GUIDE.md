# 🚀 Travel Agent AI - Complete Setup Guide

## Overview
This application uses a **pipeline architecture** where AI agents work together with budget constraints flowing through the system. Real API integrations provide actual flight and hotel data.

## Architecture

### Agent Pipeline
```
Budget Agent (v2) → Hotel Agent → Transport Agent → Activities Agent
       ↓                ↓              ↓                 ↓
   Pipeline Data → Max Price/Night → Transport Budget → Daily Budget
```

**How it works:**
1. **Budget Agent** analyzes trip and creates detailed budget breakdown:
   - Accommodation budget per night
   - Activities budget per day
   - Transport budget total
   - Food budget per day

2. **Hotel Agent** uses `hotel_budget_per_night` to filter hotels within budget

3. **Transport Agent** uses `transport_budget` to find affordable options

4. **Activities Agent** uses `activities_budget_per_day` to plan daily activities

### Real API Integrations

#### Amadeus API (Free Tier: 10,000 calls/month)
- **Flight Data**: Real-time flight search with prices, airlines, schedules
- **Hotel Data**: Live hotel availability, pricing, ratings
- **Coverage**: Global coverage with excellent India support

**Sign up:** https://developers.amadeus.com/register

## Setup Instructions

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (free tier)
- Google Gemini API key (free)
- Amadeus API credentials (free tier)

### 2. Backend Setup

#### Step 1: Install Dependencies
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### Step 2: Configure Environment Variables
Create `.env` file in `backend/` directory:

```env
# MongoDB Atlas
MONGODB_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Amadeus API (Real Flight & Hotel Data)
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret
```

**Get MongoDB URL:**
1. Go to https://cloud.mongodb.com/
2. Create free M0 cluster
3. Create database user
4. Get connection string from "Connect" → "Connect your application"
5. Replace `<username>` and `<password>` with your credentials

**Get Gemini API Key:**
1. Visit https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy key to `.env`
"""Setup Guide — Travel Agent AI

This file is the canonical setup guide for the project. It consolidates quickcopy commands and more detailed instructions for running the backend and frontend locally on Windows (PowerShell) and other platforms.

If you need a minimal quickstart, use the "Run locally (short)" section below. For step-by-step setup see the Backend and Frontend sections.
"""

## Run locally (short)

Backend (short): create a virtualenv, install requirements, and run Uvicorn

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (short):

```powershell
# from repo root
npm install
npm run dev
```

Frontend: http://localhost:5173 — Backend API: http://localhost:8000

---

## Prerequisites

- Python 3.10+ (3.11 recommended)
- Node.js 18+
- MongoDB (local or Atlas)
- Optional API keys: Google Gemini (AI), Amadeus (flights/hotels), RapidAPI/RapidAPI key for IRCTC

Notes: Do NOT commit real API keys. Use `backend/.env` and ensure `.gitignore` contains `.env` (it does).

---

## Backend — full setup (PowerShell)

1. Create and activate a virtual environment:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Create `.env` from `.env.example` and add your keys (do NOT commit `.env`):

```powershell
Copy-Item .\.env.example .\.env
# Edit backend\.env and fill values (MONGODB_URI, GOOGLE_AI_API_KEY, optional AMADEUS keys)
```

Important environment variables (examples):

- MONGODB_URI — e.g. `mongodb://localhost:27017` or Atlas connection string
- GOOGLE_AI_API_KEY — for AI-powered itinerary/budget features (use your provider)
- AMADEUS_API_KEY / AMADEUS_API_SECRET — optional (production hotel offers)
- RAPIDAPI_KEY — optional (IRCTC train data)

4. Run the server:

```powershell
# Activate venv if not active
.\.venv\Scripts\Activate.ps1

# Start uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

---

## Frontend — full setup

1. From repo root, install node dependencies and run dev server:

```powershell
npm install
npm run dev
```

2. Helpful checks:

- Typecheck: `npm run typecheck`
- Lint: `npm run lint`

---

## Verify the setup

- Health endpoint (if implemented): `GET http://localhost:8000/health`
- Open the frontend at `http://localhost:5173`, go to Trip Planner and run a sample flow.

---

## Environment & secrets guidance

- Keep keys in `backend/.env`. Add a `.env.example` with variable names only.
- Ensure `.gitignore` contains `.env`, `node_modules/`, and virtualenv folders (it does).

---

## Troubleshooting (common issues)

- Backend import errors: activate venv and reinstall requirements
  ```powershell
  .\.venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  ```
- MongoDB connection: verify `MONGODB_URI` and network access (Atlas whitelist)
- Amadeus / RapidAPI: optional keys may be missing in test environments — system falls back to generated data

---
