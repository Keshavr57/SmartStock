#!/bin/bash

echo "🔍 SmartStock Deployment Verification Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Backend Health
echo "1️⃣ Testing Backend Health..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://smartstock-lkcx.onrender.com/api/health)

if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Backend is UP and running!${NC}"
else
    echo -e "${RED}❌ Backend is DOWN (HTTP $BACKEND_RESPONSE)${NC}"
fi

echo ""

# Test Backend Market Data
echo "2️⃣ Testing Backend Market Data API..."
MARKET_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://smartstock-lkcx.onrender.com/api/market/landing-data)

if [ "$MARKET_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Market Data API is working!${NC}"
else
    echo -e "${RED}❌ Market Data API failed (HTTP $MARKET_RESPONSE)${NC}"
fi

echo ""

# Test Frontend
echo "3️⃣ Testing Frontend (Vercel)..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://smart-stock-ku3d.vercel.app)

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is UP and running!${NC}"
else
    echo -e "${RED}❌ Frontend is DOWN (HTTP $FRONTEND_RESPONSE)${NC}"
fi

echo ""

# Test CORS
echo "4️⃣ Testing CORS Configuration..."
CORS_TEST=$(curl -s -H "Origin: https://smart-stock-ku3d.vercel.app" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -X OPTIONS \
    https://smartstock-lkcx.onrender.com/api/health \
    -o /dev/null -w "%{http_code}")

if [ "$CORS_TEST" = "204" ] || [ "$CORS_TEST" = "200" ]; then
    echo -e "${GREEN}✅ CORS is properly configured!${NC}"
else
    echo -e "${RED}❌ CORS configuration issue (HTTP $CORS_TEST)${NC}"
    echo -e "${YELLOW}⚠️  Make sure ALLOWED_ORIGINS is set in Render environment variables${NC}"
fi

echo ""
echo "=============================================="
echo "📋 Summary:"
echo ""

if [ "$BACKEND_RESPONSE" = "200" ] && [ "$MARKET_RESPONSE" = "200" ] && [ "$FRONTEND_RESPONSE" = "200" ] && ([ "$CORS_TEST" = "204" ] || [ "$CORS_TEST" = "200" ]); then
    echo -e "${GREEN}✅ All systems operational!${NC}"
    echo ""
    echo "🎉 Your deployment is working correctly!"
    echo "🌐 Visit: https://smart-stock-ku3d.vercel.app"
else
    echo -e "${RED}⚠️  Some issues detected${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "1. Check Render environment variables (ALLOWED_ORIGINS)"
    echo "2. Check Vercel environment variables (VITE_API_BASE_URL, etc.)"
    echo "3. Wait for deployments to finish (5-10 minutes)"
    echo "4. Clear browser cache and try again"
fi

echo ""
