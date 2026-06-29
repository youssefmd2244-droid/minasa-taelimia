#!/bin/bash
# =====================================================================
# EduVerse — Auto Database Setup Script
# يشغّل الـ SQL على Supabase تلقائياً
# =====================================================================
# استخدام: bash setup-database.sh

SUPABASE_URL="https://naqjnxejjwcffuqunftq.supabase.co"
SUPABASE_KEY="sb_publishable_1hJHJxJIjcg7Uiz7v3qiSg_amNAFGoQ"
SQL_FILE="supabase/migrations/setup_complete.sql"

echo "🚀 جاري إعداد قاعدة البيانات..."

curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(cat $SQL_FILE | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}"

echo ""
echo "✅ اتفعل! جرّب تشغّل المشروع دلوقتي."
