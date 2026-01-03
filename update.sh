#!/bin/bash
PROJECT_ROOT=$(dirname "$0")

if [ -d "$PROJECT_ROOT/build/public/uploads" ]; then
  rm -rf "$PROJECT_ROOT/uploads"
  mv "$PROJECT_ROOT/build/public/uploads" "$PROJECT_ROOT"
fi

cd "$PROJECT_ROOT"

git reset --hard origin/master
git pull origin master

if ! cmp -s package-lock.json build/package-lock.json; then
  echo "package-lock.json changed. Installing dependencies..."
  npm install
fi

npm run build
cp .env "$PROJECT_ROOT/build/.env"

if [ -d "$PROJECT_ROOT/uploads" ]; then
  mv "$PROJECT_ROOT/uploads" "$PROJECT_ROOT/build/public"
fi

DISABLE_BOT=true node ace migration:run --force

PM2_PROCESS_NAME=$(grep -oP '^NAME=\K.*' "$PROJECT_ROOT/.env")

if [ -z "$PM2_PROCESS_NAME" ]; then
  pm2 restart all
else
  pm2 restart "$PM2_PROCESS_NAME"
fi
