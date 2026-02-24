@echo off
echo ==========================================
echo Saphira GitHub Setup
echo ==========================================
echo.

cd /d "C:\Users\OMEN\Desktop\saphire"

echo Checking Git installation...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Initializing Git repository...
git init

echo.
echo Adding all files...
git add .

echo.
echo Creating initial commit...
git commit -m "Initial commit: Saphira AI Pan-African Platform"

echo.
echo Setting up main branch...
git branch -M main

echo.
echo Adding remote repository...
git remote add origin https://github.com/runcor-io/Saphira.git

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Go to https://github.com/runcor-io/Saphira/settings/secrets/actions
 echo 2. Add the following secrets:
echo    - NEXT_PUBLIC_SUPABASE_URL
echo    - NEXT_PUBLIC_SUPABASE_ANON_KEY
echo    - SUPABASE_SERVICE_ROLE_KEY
echo    - OPENAI_API_KEY
echo    - ELEVENLABS_API_KEY
echo    - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
echo    - STRIPE_SECRET_KEY
echo    - RESEND_API_KEY
echo    - VERCEL_TOKEN (optional)
echo.
echo 3. Deploy to Vercel:
echo    npm i -g vercel
echo    cd frontend
echo    vercel --prod
echo.
pause
