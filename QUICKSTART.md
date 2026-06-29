# Quick Start Guide - Network Traffic Analyzer

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
# Visit: http://localhost:3000
\`\`\`

That's it! The app is now running with a fully functional backend.

## 📊 What You'll See

### Main Dashboard
- **Real-time Packets**: Live stream of network packets being generated
- **Traffic Statistics**: Bandwidth, packets/second, protocol distribution
- **Threat Alerts**: Suspicious activity detection
- **Connection Tracker**: Active network connections
- **Geography Map**: Visual representation of traffic sources

### Key Features
✅ Automatic packet generation (3-4 packets/second)
✅ Real-time statistics and metrics
✅ Protocol filtering (TCP, UDP, HTTP, HTTPS, DNS, etc.)
✅ Search and filter capabilities
✅ Export functionality (JSON format)
✅ Threat detection system
✅ Packet replay mode
✅ Backend status monitoring

## 🔧 Configuration

### Polling Intervals (Advanced)

Edit `/lib/config.ts`:

\`\`\`typescript
POLLING_INTERVALS: {
  PACKETS: 500,      // Fetch packets every 500ms
  STATS: 1000,       // Fetch stats every 1000ms
  CONNECTIONS: 2000, // Fetch connections every 2000ms
}
\`\`\`

### Data Limits

\`\`\`typescript
DATA_LIMITS: {
  MAX_PACKETS_DISPLAYED: 50,
  MAX_PACKETS_STORED: 1000,
  MAX_CONNECTIONS_STORED: 100,
}
\`\`\`

## 📡 API Endpoints

Test the backend API directly:

\`\`\`bash
# Get latest packets
curl "http://localhost:3000/api/packets?action=packets&limit=10"

# Get traffic statistics
curl "http://localhost:3000/api/packets?action=stats"

# Get active connections
curl "http://localhost:3000/api/packets?action=connections&limit=10"
\`\`\`

## 🎯 Common Tasks

### View Packet Details
1. Click on any packet in the list
2. A modal will show detailed information
3. Close with the X button or Escape key

### Filter by Protocol
1. Click on protocol badges in the filters panel
2. Select multiple protocols to filter
3. View only packets matching selected protocols

### Search for IP Address
1. Use the search bar at the top
2. Enter IP address, port, or protocol
3. Results update in real-time

### Pause/Resume Streaming
1. Click the "Pause" button to stop new packets
2. Click "Resume" to continue
3. Useful for analyzing specific packets

### Export Captured Data
1. Click the "Download" button
2. JSON file with all packets is downloaded
3. Use for external analysis

### View Threat Alerts
1. Navigate to the "Threats" tab
2. See all detected suspicious packets
3. Dismiss alerts one by one or clear all

### Replay Packet Stream
1. Click the "Replay" button
2. Use playback controls to review packets
3. Click "Exit Replay" to return to live mode

## 🔍 Monitoring Backend Status

The green badge in the header shows backend connection status:
- 🟢 **Green**: Backend connected and working
- 🔴 **Red**: Connection problem
- ⚠️ **Gray**: Checking connection

## 📚 Documentation

- **API_DOCUMENTATION.md** - Complete API reference
- **MIGRATION_GUIDE.md** - How mock→backend migration works
- **INTEGRATION_EXAMPLES.md** - Real data integration examples
- **BACKEND_UPGRADE_SUMMARY.md** - Full upgrade details

## 🐛 Troubleshooting

### Issue: "Backend not responding"
\`\`\`bash
# Check if API is working
curl http://localhost:3000/api/packets

# Restart dev server
npm run dev
\`\`\`

### Issue: "Packets not updating"
1. Check backend status indicator (should be green)
2. Open DevTools → Network tab
3. Look for `/api/packets` requests
4. Verify response status is 200

### Issue: "High memory usage"
1. Reduce `MAX_PACKETS_STORED` in config
2. Increase `POLLING_INTERVALS.PACKETS` value
3. Or restart the development server

### Issue: "Slow performance"
1. Reduce number of displayed packets
2. Increase polling intervals
3. Close DevTools if open (can slow down dev mode)

## 📱 Browser Console

Check the browser console for helpful debug messages starting with `[v0]`:

\`\`\`javascript
// Example debug messages:
[v0] Packets fetched: 50
[v0] Error fetching packets: Connection timeout
[v0] Backend connected
\`\`\`

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| API Docs | `/API_DOCUMENTATION.md` |
| Configuration | `/lib/config.ts` |
| Backend Code | `/app/api/packets/route.ts` |
| Hooks | `/hooks/use-backend-packets.ts` |
| Status Component | `/components/network/backend-status.tsx` |

## 🚀 Next Steps

### For Testing
1. ✅ Run locally with `npm run dev`
2. ✅ Test all UI features
3. ✅ Monitor backend with DevTools
4. ✅ Export sample data

### For Development
1. Review backend code: `/app/api/packets/route.ts`
2. Add custom endpoints in the API route
3. Create new components for custom features
4. Extend packet generation logic

### For Production
1. Replace in-memory storage with database
2. Add authentication to API
3. Implement rate limiting
4. Deploy to Vercel or other platform

## 💡 Pro Tips

### Performance
- Use `?limit=10` in API calls to reduce payload
- Adjust polling intervals based on needs
- Monitor Network tab for request sizes

### Development
- Use `console.log("[v0] ...")` for debugging
- Pause packets to analyze specific traffic
- Export data for offline analysis

### Customization
- Edit `/lib/config.ts` for global settings
- Modify `/app/api/packets/route.ts` for backend logic
- Update hooks in `/hooks/` for new features

## 📞 Need Help?

### Check These First
1. **API Documentation**: `/API_DOCUMENTATION.md`
2. **Integration Examples**: `/INTEGRATION_EXAMPLES.md`
3. **Migration Guide**: `/MIGRATION_GUIDE.md`
4. **Browser Console**: Check for `[v0]` messages

### Debug Steps
1. Verify backend is running: `curl http://localhost:3000/api/packets`
2. Check browser console for errors
3. Open DevTools Network tab
4. Review API response status and payload

## 🎓 Learning Resources

### Understanding the Architecture
1. Data flows from backend API → React hooks → Components
2. Polling happens at configurable intervals
3. Data persists in server memory during session
4. Each component subscribes to specific data

### Key Technologies
- **Next.js** - Framework and API routes
- **React** - UI components
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Lucide** - Icons

---

**Ready to start?** Run `npm run dev` and visit `http://localhost:3000` 🎉

For advanced usage, see `/INTEGRATION_EXAMPLES.md` to add real network data sources.
