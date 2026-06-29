# Network Traffic Analyzer - Backend API Documentation

## Overview

This document describes the backend API for the Network Traffic Analyzer. The backend runs on Next.js API Routes and provides real-time network packet generation and statistics.

## Architecture

The application uses a **polling-based architecture** where the frontend periodically fetches data from the backend API instead of using mock data:

- **Backend**: Next.js API Route (`/app/api/packets/route.ts`)
- **Frontend Hooks**: Custom React hooks that poll the backend
- **Data Storage**: In-memory storage on the server (ideal for development and small deployments)

## API Endpoints

### Base URL
\`\`\`
/api/packets
\`\`\`

### GET Endpoints

#### 1. Fetch Packets
\`\`\`
GET /api/packets?action=packets&limit=50&offset=0
\`\`\`

**Parameters:**
- `action`: "packets" (required)
- `limit`: Number of packets to return (default: 50, max: 200)
- `offset`: Starting position (default: 0)

**Response:**
\`\`\`json
{
  "packets": [
    {
      "id": "abc123",
      "timestamp": 1704067200000,
      "sourceIp": "192.168.1.100",
      "destIp": "8.8.8.8",
      "sourcePort": 54321,
      "destPort": 443,
      "protocol": "HTTPS",
      "size": 1024,
      "flags": ["SYN", "ACK"],
      "ttl": 64,
      "isSuspicious": false,
      "geolocation": {
        "lat": 40.7128,
        "lng": -74.006,
        "country": "United States"
      },
      "country": "United States",
      "city": "New York"
    }
  ],
  "total": 500,
  "timestamp": 1704067200000
}
\`\`\`

#### 2. Fetch Traffic Statistics
\`\`\`
GET /api/packets?action=stats
\`\`\`

**Response:**
\`\`\`json
{
  "stats": {
    "totalPackets": 500,
    "totalBytes": 512000,
    "packetsPerSecond": 3.25,
    "bytesPerSecond": 1024,
    "protocolDistribution": {
      "TCP": 150,
      "UDP": 100,
      "HTTP": 100,
      "HTTPS": 150
    },
    "suspiciousCount": 5,
    "activeConnections": 12
  },
  "timestamp": 1704067200000
}
\`\`\`

#### 3. Fetch Active Connections
\`\`\`
GET /api/packets?action=connections&limit=50&offset=0
\`\`\`

**Parameters:**
- `action`: "connections" (required)
- `limit`: Number of connections to return (default: 50, max: 200)
- `offset`: Starting position (default: 0)

**Response:**
\`\`\`json
{
  "connections": [
    {
      "id": "conn123",
      "sourceIp": "192.168.1.100",
      "destIp": "8.8.8.8",
      "sourcePort": 54321,
      "destPort": 443,
      "protocol": "TCP",
      "state": "ESTABLISHED",
      "bytesReceived": 10000,
      "bytesSent": 5000,
      "startTime": 1704067100000,
      "lastActivity": 1704067200000
    }
  ],
  "total": 25,
  "timestamp": 1704067200000
}
\`\`\`

## Frontend Hooks

### useBackendPackets

Fetches real-time packet data from the API.

\`\`\`typescript
const { packets, isLoading, error, refetch } = useBackendPackets({
  pollInterval: 500,  // Polling interval in ms
  enabled: true       // Enable/disable fetching
})
\`\`\`

### useBackendStats

Fetches network statistics from the API.

\`\`\`typescript
const { stats, isLoading, error, refetch } = useBackendStats({
  pollInterval: 1000,
  enabled: true
})
\`\`\`

### useBackendConnections

Fetches active connections from the API.

\`\`\`typescript
const { connections, isLoading, error, refetch } = useBackendConnections({
  pollInterval: 2000,
  enabled: true
})
\`\`\`

## Server-Side Packet Generation

The backend generates network packets at a **300ms interval** automatically. When the API is first called, it starts the packet generation process.

### Packet Generation Details

- **Protocols**: TCP, UDP, HTTP, HTTPS, DNS, ICMP, SSH, FTP
- **IP Ranges**: Mix of local IPs and common external IPs
- **Suspicious Packets**: ~5% of packets are marked as suspicious
- **Geolocation**: Packets include simulated city/country data
- **TCP Flags**: Realistic flag combinations (SYN, ACK, FIN, RST, etc.)

### Data Retention

- **Maximum Packets Stored**: 1000
- **Maximum Connections Stored**: 100
- Older items are automatically removed when limits are reached

## Deploying to Production

For production deployment, consider:

1. **Database Storage**: Replace in-memory storage with a proper database (PostgreSQL, MongoDB, etc.)
2. **WebSocket**: Use WebSocket instead of polling for real-time updates
3. **Real Network Data**: Integrate with actual network monitoring tools (tcpdump, Wireshark, etc.)
4. **Authentication**: Add authentication/authorization
5. **Rate Limiting**: Implement rate limiting on API endpoints

## Example Implementation

\`\`\`typescript
// Fetching packets in a React component
import { useBackendPackets } from '@/hooks/use-backend-packets'

export function PacketMonitor() {
  const { packets, isLoading, error } = useBackendPackets({
    pollInterval: 500,
    enabled: true
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2>Total Packets: {packets.length}</h2>
      <ul>
        {packets.map(packet => (
          <li key={packet.id}>
            {packet.sourceIp} → {packet.destIp} ({packet.protocol})
          </li>
        ))}
      </ul>
    </div>
  )
}
\`\`\`

## Development

### Local Testing

1. Start the development server: `npm run dev`
2. API is available at: `http://localhost:3000/api/packets`
3. Frontend automatically fetches from the API when components mount

### Debugging

Enable debug logging by checking browser console for `[v0]` prefixed messages.

## Performance Considerations

- **Polling Interval**: Adjust based on your needs (lower = more data, higher latency)
- **Packet Limit**: Reduce if memory usage is high
- **Concurrent Requests**: The API handles multiple concurrent requests efficiently

## Error Handling

All errors are returned with appropriate HTTP status codes:

- `200 OK`: Successful request
- `500 Internal Server Error`: Server-side error

Error response format:
\`\`\`json
{
  "error": "Failed to fetch packets",
  "details": "Error message"
}
\`\`\`
