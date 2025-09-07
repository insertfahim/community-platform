@echo off
echo Testing donation creation and history logging...
echo.

REM Step 1: Login
echo 1. Logging in...
curl -s -X POST http://localhost:3000/api/auth/login ^
-H "Content-Type: application/json" ^
-d "{\"email\":\"admin@example.com\",\"password\":\"password123\"}" ^
> login_response.json

if errorlevel 1 (
    echo Login failed
    exit /b 1
)

echo Login successful

REM Step 2: Extract token (basic approach)
for /f "tokens=2 delims=:, " %%a in ('findstr "token" login_response.json') do set TOKEN=%%a
set TOKEN=%TOKEN:"=%

echo Token: %TOKEN%

REM Step 3: Get initial history
echo.
echo 2. Getting initial history count...
curl -s -H "Authorization: Bearer %TOKEN%" ^
http://localhost:3000/api/history > initial_history.json

echo Initial history retrieved

REM Step 4: Create donation
echo.
echo 3. Creating test donation...
curl -s -X POST http://localhost:3000/api/donations ^
-H "Content-Type: application/json" ^
-H "Authorization: Bearer %TOKEN%" ^
-d "{\"kind\":\"Electronics\",\"description\":\"Test laptop for donation\",\"location\":\"Test Location\",\"contact\":\"test@example.com\"}" ^
> donation_response.json

echo Donation created

REM Step 5: Get updated history
echo.
echo 4. Getting updated history...
curl -s -H "Authorization: Bearer %TOKEN%" ^
http://localhost:3000/api/history > updated_history.json

echo Updated history retrieved

echo.
echo Test completed! Check the JSON files for results.
echo You can now visit http://localhost:3000/history.html to see the donation activities.

REM Cleanup
del login_response.json donation_response.json 2>nul
