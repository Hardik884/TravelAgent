# Start backend server
Write-Host "Starting Travel Agent AI Backend..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

cd backend

# Check if virtual environment exists
if (!(Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Check if .env exists
if (!(Test-Path ".env")) {
    Write-Host ""
    Write-Host "WARNING: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your Google AI Studio API key" -ForegroundColor Red
    Write-Host "Example: GOOGLE_AI_API_KEY=AIzaSy...your-key-here" -ForegroundColor Red
    Write-Host ""
    Write-Host "Get your FREE API key at:" -ForegroundColor Yellow
    Write-Host "https://makersuite.google.com/app/apikey" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "Please edit backend\.env and add your API key before continuing" -ForegroundColor Yellow
    Write-Host "See GOOGLE_AI_SETUP.md for detailed instructions" -ForegroundColor Yellow
    pause
}

# Install dependencies if needed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt

Write-Host ""
Write-Host "Starting FastAPI server..." -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs will be available at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

python main.py
