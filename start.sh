#!/bin/bash
# Start all OPCVM microservices using PM2
# Usage: ./start.sh [development|production]

set -e

ENV=${1:-production}
export NODE_ENV=$ENV

echo "Starting OPCVM platform in $ENV mode..."

if ! command -v pm2 &> /dev/null; then
  echo "PM2 not found. Installing globally..."
  npm install -g pm2
fi

pm2 start ecosystem.config.js
pm2 save

echo ""
echo "All services started. Use 'pm2 status' to check."
echo "Use 'pm2 logs' to view logs."
echo "Use 'pm2 stop all' to stop."
