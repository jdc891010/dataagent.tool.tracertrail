#!/bin/bash

# TraceTrail Connection Test Script
# This script validates connectivity to the TraceTrail API

set -e

# Configuration
API_URL="${TRACERTRAIL_API_URL:-http://localhost:8081/api}"
API_KEY="${TRACERTRAIL_API_KEY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "  TraceTrail Connection Test"
echo "============================================"
echo ""

# Test 1: Check if server is running
echo -n "[1/4] Testing server connectivity... "
HEALTH_RESPONSE=$(curl -sf -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "  Server returned: $HEALTH_RESPONSE"
    echo "  Is the TraceTrail server running?"
    exit 1
fi

# Test 2: Check API key is provided
echo -n "[2/4] Checking API key... "
if [ -z "$API_KEY" ]; then
    echo -e "${YELLOW}SKIPPED${NC}"
    echo "  TRACERTRAIL_API_KEY not set. Skipping authentication test."
    echo "  Set TRACERTRAIL_API_KEY to test authentication."
    exit 0
else
    echo -e "${GREEN}OK${NC}"
fi

# Test 3: Authenticate and get token
echo -n "[3/4] Testing authentication... "
TOKEN_RESPONSE=$(curl -sf -X POST "$API_URL/auth/token/issue" \
    -H "Content-Type: application/json" \
    -d "{\"api_key\": \"$API_KEY\"}" 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$TOKEN_RESPONSE" ]; then
    echo -e "${RED}FAILED${NC}"
    echo "  Could not connect to authentication endpoint"
    exit 1
fi

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}FAILED${NC}"
    echo "  Invalid API key or authentication failed"
    echo "  Response: $TOKEN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}OK${NC}"

# Test 4: Verify token works
echo -n "[4/4] Verifying token... "
VERIFY_RESPONSE=$(curl -sf -X POST "$API_URL/auth/token/verify" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}OK${NC}"
    echo ""
    echo -e "${GREEN}============================================"
    echo "  All tests passed!"
    echo "============================================${NC}"
    echo ""
    echo "API URL: $API_URL"
    echo "Token expires in: $(echo "$TOKEN_RESPONSE" | grep -o '"expires_in":[0-9]*' | cut -d':' -f2) seconds"
    echo ""
    exit 0
else
    echo -e "${RED}FAILED${NC}"
    echo "  Token verification failed"
    exit 1
fi
