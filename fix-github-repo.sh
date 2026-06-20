#!/bin/bash
# Script to fix missing .ts/.css extensions on GitHub repo
# Run this in your project root folder, then commit + push

echo "=== Fixing file extensions ==="

# API routes
for f in \
  src/app/api/cron/daily-task/route \
  src/app/api/cron/daily-update/route \
  src/app/api/cron/hourly-update/route \
  src/app/api/dashboard/route \
  src/app/api/health/route
do
  if [ -f "$f" ] && [ ! -f "${f}.ts" ]; then
    git mv "$f" "${f}.ts"
    echo "  renamed $f -> ${f}.ts"
  fi
done

# CSS file
if [ -f "src/app/globals" ] && [ ! -f "src/app/globals.css" ]; then
  git mv "src/app/globals" "src/app/globals.css"
  echo "  renamed src/app/globals -> src/app/globals.css"
fi

# Lib files
for f in \
  src/lib/dashboard-data \
  src/lib/dashboard-store \
  src/lib/search-index \
  src/lib/export-utils
do
  if [ -f "$f" ] && [ ! -f "${f}.ts" ]; then
    git mv "$f" "${f}.ts"
    echo "  renamed $f -> ${f}.ts"
  fi
done

# DB files
for f in \
  src/db/index \
  src/db/schema
do
  if [ -f "$f" ] && [ ! -f "${f}.ts" ]; then
    git mv "$f" "${f}.ts"
    echo "  renamed $f -> ${f}.ts"
  fi
done

echo ""
echo "=== Done. Now run: ==="
echo "  git add ."
echo "  git commit -m 'fix: restore .ts/.css file extensions'"
echo "  git push"
