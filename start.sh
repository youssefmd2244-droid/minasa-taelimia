#!/bin/bash
echo "===================================="
echo "   EduVerse - جاري التشغيل..."
echo "===================================="

if [ ! -d "node_modules" ]; then
    echo "[1/2] جاري تثبيت المكتبات (مرة واحدة فقط)..."
    npm install
fi

echo "[2/2] جاري تشغيل التطبيق..."
echo "افتح المتصفح على: http://localhost:5173"
npm run dev
