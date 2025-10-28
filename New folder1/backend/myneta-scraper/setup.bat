@echo off
echo ================================
echo MyNeta Scraper Setup
echo ================================
echo.

echo Step 1: Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    echo Make sure Python is installed and in PATH
    pause
    exit /b 1
)
echo ✓ Virtual environment created
echo.

echo Step 2: Activating virtual environment...
call venv\Scripts\activate.bat
echo ✓ Virtual environment activated
echo.

echo Step 3: Installing dependencies...
pip install requests beautifulsoup4 lxml pandas
echo.
echo Optional: Installing Selenium (for fallback)...
pip install selenium webdriver-manager
echo ✓ Dependencies installed
echo.

echo ================================
echo Setup Complete!
echo ================================
echo.
echo To activate the environment in future:
echo   venv\Scripts\activate
echo.
echo To run the scraper:
echo   python myneta_scraper.py
echo.
pause
