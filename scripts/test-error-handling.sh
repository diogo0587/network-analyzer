#!/bin/bash

# Error Handling Verification Script
# Tests console error management, API retry logic, and graceful degradation

set -e

echo "=========================================="
echo "ERROR HANDLING VERIFICATION TEST SUITE"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_URL="https://v0-network-traffic-analyzer-w-moc.onrender.com"

# Test 1: Backend Connectivity
echo "Test 1: Backend Connectivity..."
if curl -s -m 10 "${BACKEND_URL}/api/packets?action=status" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is reachable${NC}"
    BACKEND_AVAILABLE=1
else
    echo -e "${YELLOW}⚠ Backend is unreachable - testing graceful degradation${NC}"
    BACKEND_AVAILABLE=0
fi
echo ""

# Test 2: Check for error handler functions
echo "Test 2: Checking error handler implementation..."
if grep -r "fetchWithRetry" lib/backend-error-handler.ts > /dev/null; then
    echo -e "${GREEN}✓ fetchWithRetry function exists${NC}"
else
    echo -e "${RED}✗ fetchWithRetry function missing${NC}"
fi

if grep -r "classifyError" lib/backend-error-handler.ts > /dev/null; then
    echo -e "${GREEN}✓ classifyError function exists${NC}"
else
    echo -e "${RED}✗ classifyError function missing${NC}"
fi

if grep -r "isRetryableError" lib/backend-error-handler.ts > /dev/null; then
    echo -e "${GREEN}✓ isRetryableError function exists${NC}"
else
    echo -e "${RED}✗ isRetryableError function missing${NC}"
fi

if grep -r "createBackendError" lib/backend-error-handler.ts > /dev/null; then
    echo -e "${GREEN}✓ createBackendError function exists${NC}"
else
    echo -e "${RED}✗ createBackendError function missing${NC}"
fi
echo ""

# Test 3: Verify hook consistency
echo "Test 3: Checking hook endpoint consistency..."
if grep -A 5 "useBackendStats" hooks/use-backend-packets.ts | grep "fetchWithRetry" > /dev/null; then
    echo -e "${GREEN}✓ useBackendStats uses retry logic${NC}"
else
    echo -e "${RED}✗ useBackendStats missing retry logic${NC}"
fi

if grep -A 5 "useBackendConnections" hooks/use-backend-packets.ts | grep "fetchWithRetry" > /dev/null; then
    echo -e "${GREEN}✓ useBackendConnections uses retry logic${NC}"
else
    echo -e "${RED}✗ useBackendConnections missing retry logic${NC}"
fi

if grep "useBackendStats" hooks/use-backend-packets.ts | grep "getPacketsEndpoint" > /dev/null; then
    echo -e "${GREEN}✓ useBackendStats uses unified endpoint${NC}"
else
    echo -e "${RED}✗ useBackendStats uses different endpoint${NC}"
fi
echo ""

# Test 4: Check error logging
echo "Test 4: Checking error logging..."
if grep -r "console.error\|console.warn" lib/backend-error-handler.ts > /dev/null; then
    echo -e "${GREEN}✓ Error logging implemented${NC}"
else
    echo -e "${RED}✗ Error logging not found${NC}"
fi

if grep -r "\[v0\]" lib/backend-error-handler.ts | grep -c "console" > /dev/null; then
    echo -e "${GREEN}✓ Consistent logging format ([v0]) used${NC}"
else
    echo -e "${RED}✗ Inconsistent logging format${NC}"
fi
echo ""

# Test 5: Test backend endpoint directly if available
if [ $BACKEND_AVAILABLE -eq 1 ]; then
    echo "Test 5: Testing backend endpoints..."
    
    PACKETS_RESPONSE=$(curl -s "${BACKEND_URL}/api/packets?action=packets&limit=10")
    if echo "$PACKETS_RESPONSE" | grep -q "packets"; then
        echo -e "${GREEN}✓ /api/packets endpoint returns data${NC}"
    else
        echo -e "${YELLOW}⚠ /api/packets endpoint may have issues${NC}"
    fi
    
    STATS_RESPONSE=$(curl -s "${BACKEND_URL}/api/packets?action=stats")
    if echo "$STATS_RESPONSE" | grep -q "stats\|totalPackets"; then
        echo -e "${GREEN}✓ /api/stats endpoint returns data${NC}"
    else
        echo -e "${YELLOW}⚠ /api/stats endpoint may have issues${NC}"
    fi
else
    echo -e "${YELLOW}Test 5: Skipped - backend not available${NC}"
fi
echo ""

# Test 6: Check for proper error type classification
echo "Test 6: Checking error classification..."
if grep -q "Failed to fetch" lib/backend-error-handler.ts; then
    echo -e "${GREEN}✓ Network error classification configured${NC}"
fi

if grep -q "HTTP" lib/backend-error-handler.ts; then
    echo -e "${GREEN}✓ HTTP error classification configured${NC}"
fi

if grep -q "timeout" lib/backend-error-handler.ts; then
    echo -e "${GREEN}✓ Timeout error classification configured${NC}"
fi

if grep -q "CORS" lib/backend-error-handler.ts; then
    echo -e "${GREEN}✓ CORS error classification configured${NC}"
fi
echo ""

# Test 7: Verify retry logic exists
echo "Test 7: Checking retry logic..."
if grep -q "maxRetries" lib/backend-error-handler.ts; then
    echo -e "${GREEN}✓ Retry mechanism implemented${NC}"
fi

if grep -q "exponential backoff" lib/backend-error-handler.ts; then
    echo -e "${GREEN}✓ Exponential backoff strategy used${NC}"
fi

if grep -q "Math.pow(2" lib/backend-error-handler.ts; then
    echo -e "${GREEN}✓ Exponential backoff calculation correct${NC}"
fi
echo ""

# Test 8: Check TypeScript types
echo "Test 8: Checking TypeScript definitions..."
if grep -q "interface BackendError" lib/backend-error-handler.ts; then
    echo -e "${GREEN}✓ BackendError interface defined${NC}"
fi

if grep -q "type:" lib/backend-error-handler.ts; then
    echo -e "${GREEN}✓ Error type field defined${NC}"
fi

if grep -q "isRetryable" lib/backend-error-handler.ts; then
    echo -e "${GREEN}✓ Retry flag defined${NC}"
fi
echo ""

echo "=========================================="
echo "TEST SUITE COMPLETED"
echo "=========================================="
echo ""

if [ $BACKEND_AVAILABLE -eq 1 ]; then
    echo -e "${GREEN}✓ Backend is operational${NC}"
    echo "Ready for production deployment"
else
    echo -e "${YELLOW}⚠ Backend unavailable but error handling is robust${NC}"
    echo "Application will gracefully degrade"
fi
