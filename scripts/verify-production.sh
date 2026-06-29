#!/bin/bash

# Production Integrity Verification Script
# Checks that the frontend and backend are properly configured

echo "🔍 Production Setup Verification"
echo "=================================="
echo ""

# Check 1: Verify Render backend URL is configured
echo "✓ Check 1: Verifying backend configuration..."
if grep -q "https://v0-network-traffic-analyzer-w-moc.onrender.com" lib/api-config.ts; then
    echo "  ✅ Render backend URL configured correctly"
else
    echo "  ❌ Render backend URL not found in api-config.ts"
    exit 1
fi
echo ""

# Check 2: Verify no mock files exist
echo "✓ Check 2: Checking for removed mock/fallback code..."
if [ -f "lib/network-monitor-fallback.ts" ]; then
    echo "  ❌ Mock fallback monitor still exists"
    exit 1
else
    echo "  ✅ Mock fallback monitor removed"
fi

if [ -f "lib/packet-generator.ts" ]; then
    echo "  ❌ Mock packet generator still exists"
    exit 1
else
    echo "  ✅ Mock packet generator removed"
fi
echo ""

# Check 3: Verify API route uses real monitor only
echo "✓ Check 3: Checking API endpoint configuration..."
if grep -q "getRealNetworkMonitor" app/api/packets/route.ts && ! grep -q "getFallbackMonitor" app/api/packets/route.ts; then
    echo "  ✅ API uses real network monitor only"
else
    echo "  ❌ API still has fallback code"
    exit 1
fi
echo ""

# Check 4: Verify DynamoDB imports removed from main API
echo "✓ Check 4: Checking for removed DynamoDB integration..."
if ! grep -q "getRecentPackets\|getPacketStats\|storePacket" app/api/packets/route.ts; then
    echo "  ✅ DynamoDB calls removed from API"
else
    echo "  ❌ DynamoDB integration still present in API"
    exit 1
fi
echo ""

# Check 5: Verify CORS headers are configured
echo "✓ Check 5: Checking CORS configuration..."
if grep -q "Access-Control-Allow-Origin" app/api/packets/route.ts; then
    echo "  ✅ CORS headers configured"
else
    echo "  ❌ CORS headers missing"
    exit 1
fi
echo ""

# Check 6: Verify hook has proper error handling
echo "✓ Check 6: Checking frontend error handling..."
if grep -q "console.log.*Fetching from" hooks/use-backend-packets.ts && grep -q "setIsLoading(false)" hooks/use-backend-packets.ts; then
    echo "  ✅ Error handling and logging in place"
else
    echo "  ❌ Error handling incomplete"
    exit 1
fi
echo ""

# Check 7: Verify no Vercel-specific environment variables in client code
echo "✓ Check 7: Checking for hardcoded configuration..."
if grep -q "process.env.NEXT_PUBLIC" lib/api-config.ts || grep -q "environment variable" lib/api-config.ts; then
    echo "  ⚠️  Consider using environment variables"
else
    echo "  ✅ Configuration is static (OK for Vercel)"
fi
echo ""

echo "=================================="
echo "✅ All production integrity checks passed!"
echo ""
echo "Ready for deployment:"
echo "1. Commit and push to GitHub"
echo "2. Vercel will auto-deploy to production"
echo "3. Monitor: https://dashboard.render.com/"
echo "4. Verify data flow at deployed URL"
