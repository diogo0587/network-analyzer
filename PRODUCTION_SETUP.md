# Production Setup - Real Network Data from Render Backend

## Architecture

\`\`\`
Vercel Frontend (Next.js) → Render Backend (Real Network Monitor) → Real Network Packets
\`\`\`

## Current Setup

### Backend (Running on Render)
- URL: `https://v0-network-traffic-analyzer-w-moc.onrender.com`
- Captures real network traffic from the server's interface
- Serves real data only - no mock data
- Endpoints:
  - `GET /api/packets?action=packets&limit=50` - Get real network packets
  - `GET /api/packets?action=connections` - Get active connections
  - `GET /api/packets?action=stats` - Get traffic statistics
  - `GET /api/packets?action=status` - Get monitoring status

### Frontend (Deploy to Vercel)
- Uses Next.js App Router
- Communicates with Render backend for data
- No local mock data - all data from real network monitor
- Real-time updates via polling (500ms interval)

## Deployment Steps

### 1. Deploy to Vercel

\`\`\`bash
# Ensure all changes are committed
git add -A
git commit -m "Production ready: real data from Render backend"

# Push to trigger Vercel deployment
git push origin main
\`\`\`

### 2. Verify Backend Status

Before deploying frontend, verify Render backend is operational:

\`\`\`bash
curl https://v0-network-traffic-analyzer-w-moc.onrender.com/api/packets?action=status

# Expected response:
# {
#   "status": {
#     "isActive": true,
#     "platform": "linux" or "darwin" or "win32",
#     "packetsCount": 1234
#   },
#   "timestamp": 1234567890
# }
\`\`\`

### 3. Check Frontend Connection

After Vercel deployment, check that frontend connects successfully:

1. Open deployed URL in browser
2. Check browser console for success messages: `[v0] Fetching from: https://v0-network-traffic-analyzer-w-moc.onrender.com/api/packets`
3. Verify real packets appear in dashboard (not empty state)

## Production Checklist

- [x] Removed all mock data generators
- [x] Removed fallback monitors
- [x] Configured Render backend as primary data source
- [x] Added CORS headers for cross-origin requests
- [x] Implemented error handling with logging
- [x] Real-time polling configured
- [ ] Deploy to Vercel
- [ ] Verify data flow from Render to Vercel
- [ ] Monitor browser console for errors
- [ ] Check that live packets display in UI

## Troubleshooting

### "Failed to fetch" error in browser console

**Cause**: Frontend cannot reach Render backend

**Solution**:
1. Verify Render backend is running: `curl https://v0-network-traffic-analyzer-w-moc.onrender.com/api/packets?action=status`
2. Check CORS headers are present
3. Verify no browser console errors in Network tab
4. Check Vercel environment variables are correct

### No packets showing in dashboard

**Cause**: Backend running but no network traffic captured

**Solution**:
1. SSH into Render and check system processes: `netstat -tulpn | head -20`
2. Verify network interface is accessible: `ip addr` or `ifconfig`
3. Check monitoring process is capturing: Check server logs

### High latency or slow updates

**Cause**: Polling interval too short or backend overloaded

**Solution**:
1. Adjust poll interval in `hooks/use-backend-packets.ts` (currently 500ms)
2. Check Render instance resources (CPU, Memory)
3. Monitor network bandwidth usage

## Data Flow

1. **Real Network Monitor** (Render server)
   - Captures packets from network interface
   - Aggregates statistics
   - Returns only real data

2. **API Endpoint** (Render)
   - Handles HTTP requests
   - Returns JSON with real packets
   - Includes CORS headers

3. **Frontend Hook** (Vercel)
   - Polls API every 500ms
   - Parses JSON response
   - Updates component state
   - Displays real-time data

## No Mock Data

- ✅ Packet generator removed
- ✅ Fallback monitor removed
- ✅ All data from real network monitor
- ✅ Production-only configuration
- ✅ Error handling for connectivity issues

## Monitoring

Monitor the deployment in production:

\`\`\`bash
# Check Render logs
# Visit: https://dashboard.render.com/services/

# Check Vercel logs and analytics
# Visit: https://vercel.com/dashboard
\`\`\`
