# Migration Guide: Mock to Backend API

## Overview

This document explains how the Network Traffic Analyzer was migrated from mock data generation to a real backend API that generates network traffic data.

## What Changed

### Before (Mock Data)
- Packet generation happened directly in the React component using `generatePacket()`
- All data was generated client-side
- No network calls to a backend server
- Data was regenerated on every page load

### After (Backend API)
- Packet generation happens on the server in a Next.js API Route
- Frontend polls the API endpoint for new data
- Data persists across page loads (stored in server memory)
- Better separation of concerns (backend/frontend)
- Easier to scale and integrate real data sources

## Architecture Changes

### Old Architecture
\`\`\`
React Component
    ↓
generatePacket() [Client-side]
    ↓
usePacketStream() [React State]
    ↓
UI Components
\`\`\`

### New Architecture
\`\`\`
React Component
    ↓
useBackendPackets() [React Hook]
    ↓
Fetch /api/packets [Network Request]
    ↓
Backend (/api/packets/route.ts)
    ├─ Generates Packets
    ├─ Manages Connections
    └─ Stores Data (In-memory)
    ↓
UI Components
\`\`\`

## Key Components Modified

### 1. New Backend API Route
**File**: `/app/api/packets/route.ts`

Creates a Next.js API endpoint that:
- Generates packets at regular intervals
- Manages in-memory data storage
- Provides three main endpoints:
  - `?action=packets` - Get latest packets
  - `?action=stats` - Get traffic statistics
  - `?action=connections` - Get active connections

### 2. New Backend Hooks
**File**: `/hooks/use-backend-packets.ts`

Three new hooks for fetching data from the API:
- `useBackendPackets()` - Fetches packet data
- `useBackendStats()` - Fetches statistics
- `useBackendConnections()` - Fetches connections

### 3. Updated Main Hook
**File**: `/hooks/use-packet-stream.ts`

Modified to:
- Use `useBackendPackets()` internally
- Poll the API instead of generating local data
- Maintain filter/search functionality
- Add loading state

### 4. Configuration
**File**: `/lib/config.ts`

New configuration system to:
- Toggle between mock and backend modes
- Control polling intervals
- Set data limits
- Manage feature flags

## Usage Examples

### Fetching Packets from Backend
\`\`\`typescript
import { useBackendPackets } from '@/hooks/use-backend-packets'

function MyComponent() {
  const { packets, isLoading, error } = useBackendPackets({
    pollInterval: 500,
    enabled: true
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {packets.map(packet => (
        <div key={packet.id}>{packet.sourceIp}</div>
      ))}
    </div>
  )
}
\`\`\`

### Using the Main Packet Stream Hook
\`\`\`typescript
import { usePacketStream } from '@/hooks/use-packet-stream'

function PacketMonitor() {
  const {
    packets,
    isLoading,
    isPaused,
    togglePause,
  } = usePacketStream(500)

  return (
    <div>
      {isLoading ? <div>Loading...</div> : (
        <div>
          <button onClick={togglePause}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <div>{packets.length} packets</div>
        </div>
      )}
    </div>
  )
}
\`\`\`

## Data Flow

### Packet Generation Flow
1. API Route initializes on first request
2. Packet generation starts automatically every 300ms
3. Generated packets stored in in-memory array (max 1000)
4. Older packets automatically removed when limit reached

### Frontend Data Fetching Flow
1. Component mounts and calls `useBackendPackets()`
2. Hook immediately fetches latest packets from API
3. Hook sets up polling interval (e.g., 500ms)
4. Component re-renders with new packet data
5. Component unmounts → polling stopped

## Polling Strategy

Different data types have different polling intervals:

| Data Type | Interval | Reason |
|-----------|----------|--------|
| Packets | 500ms | High-frequency updates |
| Stats | 1000ms | Can be computed less frequently |
| Connections | 2000ms | Relatively stable |

## Switching Back to Mock Data (Development)

If you need to switch back to mock data during development:

### Option 1: Disable API in Configuration
\`\`\`typescript
// lib/config.ts
export const CONFIG = {
  USE_BACKEND_API: false,  // ← Change to false
  ...
}
\`\`\`

### Option 2: Use Original usePacketStream Logic
Create a new hook that uses `generatePacket()` directly instead of API calls.

## Performance Considerations

### Memory Usage
- **Packets**: ~1KB per packet × 1000 max = ~1MB
- **Connections**: ~200 bytes × 100 max = ~20KB
- Total: ~1.02MB maximum

### Network Usage
- **Packets endpoint**: ~50KB per request (50 packets)
- At 500ms interval: ~100KB/s maximum
- Adjust polling intervals to reduce bandwidth

### CPU Usage
- Packet generation: ~0.1ms per packet
- At 300ms interval: ~3-4 packets/second
- Negligible CPU impact

## Database Integration (Future)

To integrate with a real database:

1. Replace in-memory storage with database calls
2. Use connection pooling (pg-pool, Prisma, etc.)
3. Add indexes on frequently queried fields (IP, protocol, timestamp)
4. Implement data archiving/cleanup strategy

Example with PostgreSQL:
\`\`\`typescript
import { Client } from 'pg'

const client = new Client({ connectionString: process.env.DATABASE_URL })

// In API route
const result = await client.query(
  'SELECT * FROM packets ORDER BY timestamp DESC LIMIT $1',
  [limit]
)
\`\`\`

## WebSocket Upgrade (Future)

For real-time updates without polling:

\`\`\`typescript
// In API route
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  if (searchParams.get('upgrade') === 'websocket') {
    // Handle WebSocket upgrade
  }
}
\`\`\`

## Troubleshooting

### Issue: "API not responding"
**Solution**: Check if `/api/packets` route is working:
\`\`\`bash
curl http://localhost:3000/api/packets?action=packets
\`\`\`

### Issue: "Packets not updating"
**Solution**: Verify polling is enabled and interval is not too high

### Issue: "High memory usage"
**Solution**: Reduce MAX_PACKETS_STORED in config or add database

## Testing

To test the backend API:

\`\`\`bash
# Fetch packets
curl "http://localhost:3000/api/packets?action=packets&limit=10"

# Fetch statistics
curl "http://localhost:3000/api/packets?action=stats"

# Fetch connections
curl "http://localhost:3000/api/packets?action=connections"
\`\`\`

## Summary

| Aspect | Mock | Backend API |
|--------|------|-------------|
| Data Persistence | No | Yes (in-memory) |
| Server Load | None | Minimal |
| Real-time Updates | Local only | Network-based |
| Scalability | Limited | Good foundation |
| Production Ready | No | With database |
| Testing Easier | Yes | Yes (API endpoint) |
