# Travel Agent Backend Setup Script
Write-Host "🚀 Setting up Travel Agent Backend..." -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "backend")) {
    Write-Host "❌ Error: 'backend' folder not found!" -ForegroundColor Red
    Write-Host "Please run this script from the TravelAgent project root directory." -ForegroundColor Yellow
    exit 1
}

# Navigate to backend
Set-Location backend

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Virtual environment created!" -ForegroundColor Green
} else {
    Write-Host "✅ Virtual environment already exists!" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to activate virtual environment!" -ForegroundColor Red
    Write-Host "💡 Try running: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
    exit 1
}

# Upgrade pip
Write-Host "📦 Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Write-Host "⏳ This may take a few minutes..." -ForegroundColor Cyan
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Backend setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Get your FREE Google AI API key from: https://makersuite.google.com/app/apikey" -ForegroundColor White
Write-Host "2. Create a .env file in the backend folder with:" -ForegroundColor White
Write-Host "   GOOGLE_AI_API_KEY=your_key_here" -ForegroundColor Yellow
Write-Host "3. Run: .\start-backend.ps1" -ForegroundColor White
Write-Host ""
