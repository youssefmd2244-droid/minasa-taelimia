@echo off
echo ====================================
echo    EduVerse - جاري التشغيل...
echo ====================================
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [1/2] جاري تثبيت المكتبات (مرة واحدة فقط)...
    npm install
    echo.
)

echo [2/2] جاري تشغيل التطبيق...
echo.
echo افتح المتصفح على: http://localhost:5173
echo.
npm run dev
pause
