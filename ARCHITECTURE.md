# System Architecture

## High-Level Overview

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              React Components                      │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Page.tsx (Main Dashboard)                  │  │    │
│  │  │  - PacketStream                             │  │    │
│  │  │  - StatisticsChart                          │  │    │
│  │  │  - ProtocolFilters                          │  │    │
│  │  │  - ConnectionTracker                        │  │    │
│  │  │  - ThreatAlerts                             │  │    │
│  │  │  - BackendStatus (new)                      │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                      ▲                                       │
│                      │ (props)                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           React Hooks (Data Layer)                │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  usePacketStream()                          │  │    │
│  │  │  ├─ useBackendPackets() [NEW]              │  │    │
│  │  │  ├─ Filter & Search Logic                   │  │    │
│  │  │  └─ State Management                        │  │    │
│  │  │                                              │  │    │
│  │  │  useTrafficStats()                          │  │    │
│  │  │  ├─ useBackendStats() [NEW]               │  │    │
│  │  │  └─ Metrics Calculation                     │  │    │
│  │  │                                              │  │    │
│  │  │  useThreatDetection()                       │  │    │
│  │  │  └─ Threat Detection Logic                  │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                      ▲                                       │
│                      │ HTTP Requests                        │
└──────────────────────┼───────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
   ┌─────────────────────────┐  ┌──────────────────┐
   │  Fetch API              │  │  Polling Timer   │
   │  (500ms - 2s intervals) │  │  (Configurable)  │
   └─────────────────────────┘  └──────────────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────────┐
        │                                 │
        │  HTTP Layer (Next.js Server)    │
        │                                 │
        └──────────────┬──────────────────┘
                       │
┌──────────────────────┴─────────────────────────────┐
│         Next.js Server (Backend)                   │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  API Route: /api/packets                     │ │
│  │                                              │ │
│  │  GET Parameters:                             │ │
│  │  ├─ action=packets      → Packets endpoint   │ │
│  │  ├─ action=stats        → Stats endpoint     │ │
│  │  ├─ action=connections  → Connections EP     │ │
│  │  ├─ limit=N             → Result limit       │ │
│  │  └─ offset=N            → Pagination offset  │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                       ▲                            │
│                       │                            │
│  ┌────────────────────┴────────────────────────┐  │
│  │    Data Generation & Management             │  │
│  │                                             │  │
│  │  ┌─────────────────────────────────────┐   │  │
│  │  │  Packet Generator                   │   │  │
│  │  │  (generatePacket function)          │   │  │
│  │  │  ├─ Protocol selection              │   │  │
│  │  │  ├─ IP address generation           │   │  │
│  │  │  ├─ Port assignment                 │   │  │
│  │  │  ├─ Packet size calculation         │   │  │
│  │  │  ├─ Flag generation (TCP)           │   │  │
│  │  │  └─ Geolocation data                │   │  │
│  │  └─────────────────────────────────────┘   │  │
│  │                                             │  │
│  │  ┌─────────────────────────────────────┐   │  │
│  │  │  Connection Generator               │   │  │
│  │  │  (generateConnection function)      │   │  │
│  │  │  ├─ Connection state management    │   │  │
│  │  │  ├─ Bytes sent/received            │   │  │
│  │  │  └─ Activity tracking              │   │  │
│  │  └─────────────────────────────────────┘   │  │
│  └──────────────────┬──────────────────────────┘  │
│                     │                              │
│  ┌──────────────────▼──────────────────────────┐  │
│  │    In-Memory Data Storage                  │  │
│  │                                             │  │
│  │  ┌─────────────────────────────────────┐   │  │
│  │  │  packetStore: PacketHeader[]        │   │  │
│  │  │  ├─ Max size: 1000 packets          │   │  │
│  │  │  ├─ FIFO removal (oldest first)     │   │  │
│  │  │  └─ Real-time updates               │   │  │
│  │  └─────────────────────────────────────┘   │  │
│  │                                             │  │
│  │  ┌─────────────────────────────────────┐   │  │
│  │  │  connectionStore: Connection[]      │   │  │
│  │  │  ├─ Max size: 100 connections       │   │  │
│  │  │  ├─ Active connection tracking      │   │  │
│  │  │  └─ Real-time updates               │   │  │
│  │  └─────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
\`\`\`

## Data Flow Diagram

### Request-Response Cycle

\`\`\`
1. COMPONENT INITIALIZATION
   ┌─────────────────────────────┐
   │ React Component Mounts      │
   └──────────────┬──────────────┘
                  │
                  ▼
   ┌─────────────────────────────┐
   │ Call usePacketStream()      │
   └──────────────┬──────────────┘
                  │
                  ▼
   ┌─────────────────────────────┐
   │ Call useBackendPackets()    │
   └──────────────┬──────────────┘
                  │
2. INITIAL FETCH
                  ▼
   ┌─────────────────────────────────────────┐
   │ Fetch /api/packets?action=packets      │
   └──────────────┬──────────────────────────┘
                  │
3. BACKEND PROCESSING
                  ▼
   ┌─────────────────────────────────────────┐
   │ Backend receives request                │
   │ └─ Start packet generation if not running
   │ └─ Return latest packets from store     │
   └──────────────┬──────────────────────────┘
                  │
4. RESPONSE
                  ▼
   ┌─────────────────────────────────────────┐
   │ Return JSON:                            │
   │ {                                       │
   │   packets: [...],                       │
   │   total: 50,                            │
   │   timestamp: 1704067200000              │
   │ }                                       │
   └──────────────┬──────────────────────────┘
                  │
5. STATE UPDATE
                  ▼
   ┌─────────────────────────────────────────┐
   │ Update React state with packets         │
   │ └─ Trigger re-render                    │
   └──────────────┬──────────────────────────┘
                  │
6. SETUP POLLING
                  ▼
   ┌─────────────────────────────────────────┐
   │ Start polling interval (500ms)          │
   │ └─ Repeat from step 2 every 500ms       │
   └─────────────────────────────────────────┘
\`\`\`

## Component Hierarchy

\`\`\`
<NetworkAnalyzerPage>
  ├─ <Header>
  │  ├─ <BackendStatus> [NEW]
  │  ├─ <Button> Pause/Resume
  │  ├─ <Button> Clear
  │  ├─ <Button> Replay
  │  └─ <Button> Export
  │
  ├─ <Tabs>
  │  ├─ <TabsContent> "Live"
  │  │  ├─ <PacketSearch>
  │  │  ├─ <ProtocolFilters>
  │  │  ├─ <PacketStream>
  │  │  ├─ <BandwidthMeter>
  │  │  ├─ <StatisticsChart>
  │  │  └─ <StatsOverview>
  │  │
  │  ├─ <TabsContent> "Analytics"
  │  │  ├─ <AdvancedStatsDashboard>
  │  │  ├─ <TrafficHeatmap>
  │  │  └─ <TrafficMap>
  │  │
  │  ├─ <TabsContent> "Connections"
  │  │  └─ <ConnectionTracker>
  │  │
  │  └─ <TabsContent> "Threats"
  │     └─ <ThreatAlerts>
  │
  └─ <ReplayControls>
\`\`\`

## State Management Flow

\`\`\`
usePacketStream() Hook
│
├─ Internal State (useReducer)
│  ├─ packets: PacketHeader[]
│  ├─ filteredPackets: PacketHeader[]
│  ├─ activeFilters: Set<Protocol>
│  ├─ searchQuery: string
│  ├─ isPaused: boolean
│  └─ isLoading: boolean
│
├─ useBackendPackets() → Gets packets from API
│  └─ Updates internal state when data arrives
│
├─ useEffect (filtering)
│  └─ Applies active filters and search
│
└─ Exposed Methods
   ├─ toggleFilter()
   ├─ clearFilters()
   ├─ setSearchQuery()
   ├─ togglePause()
   └─ clearPackets()
\`\`\`

## Data Types

### PacketHeader
\`\`\`typescript
interface PacketHeader {
  id: string                    // Unique identifier
  timestamp: number             // Unix timestamp (ms)
  sourceIp: string             // Source IP (e.g., 192.168.1.1)
  destIp: string               // Destination IP
  sourcePort: number           // Source port (0-65535)
  destPort: number             // Destination port
  protocol: Protocol           // TCP, UDP, HTTP, HTTPS, etc.
  size: number                 // Packet size in bytes
  flags: string[]              // TCP flags (SYN, ACK, etc.)
  ttl: number                  // Time to live
  isSuspicious: boolean        // Flagged by threat detection
  geolocation: {               // Geographic data
    lat: number
    lng: number
    country: string
  }
  country: string
  city: string
}
\`\`\`

### TrafficStats
\`\`\`typescript
interface TrafficStats {
  totalPackets: number         // Total packets captured
  totalBytes: number           // Total data in bytes
  packetsPerSecond: number     // Current rate
  bytesPerSecond: number       // Current bandwidth
  protocolDistribution: Record<string, number>  // Count per protocol
  suspiciousCount: number      // Suspicious packets
  activeConnections: number    // Open connections
}
\`\`\`

## File Organization

\`\`\`
/
├─ app/
│  ├─ api/
│  │  └─ packets/
│  │     └─ route.ts [NEW]          ← Backend API
│  ├─ layout.tsx
│  ├─ globals.css
│  └─ page.tsx                      ← Main page
│
├─ components/
│  ├─ ui/                           ← Shadcn components
│  └─ network/
│     ├─ packet-stream.tsx
│     ├─ packet-search.tsx
│     ├─ protocol-filters.tsx
│     ├─ statistics-chart.tsx
│     ├─ connection-tracker.tsx
│     ├─ threat-alerts.tsx
│     ├─ backend-status.tsx [NEW]
│     └─ ...more components
│
├─ hooks/
│  ├─ use-packet-stream.ts          ← Updated for backend
│  ├─ use-backend-packets.ts [NEW]  ← New backend hooks
│  ├─ use-traffic-stats.ts          ← Updated for backend
│  ├─ use-threat-detection.ts
│  ├─ use-packet-replay.ts
│  └─ ...more hooks
│
├─ lib/
│  ├─ packet-generator.ts
│  ├─ threat-detection.ts
│  ├─ format.ts
│  ├─ types.ts
│  └─ config.ts [NEW]               ← Configuration
│
└─ Documentation
   ├─ API_DOCUMENTATION.md [NEW]
   ├─ MIGRATION_GUIDE.md [NEW]
   ├─ INTEGRATION_EXAMPLES.md [NEW]
   ├─ ARCHITECTURE.md [NEW]
   ├─ BACKEND_UPGRADE_SUMMARY.md [NEW]
   └─ QUICKSTART.md [NEW]
\`\`\`

## Polling Strategy

\`\`\`
Timeline (milliseconds):
│
├─ T=0ms     ← Component mounts
│  └─ Initial fetch request
│
├─ T=50ms    ← Response arrives
│  └─ State updated, render
│
├─ T=500ms   ← Timer fires (PACKETS poll interval)
│  └─ Fetch request for packets
│
├─ T=550ms   ← Response arrives
│  └─ State updated, render
│
├─ T=1000ms  ← Timer fires (STATS poll interval)
│  ├─ Fetch stats request
│  └─ PACKETS poll fires again (550ms + 500ms)
│
├─ T=1050ms  ← Both responses arrive
│  └─ State updated, render
│
└─ T=2000ms  ← CONNECTIONS poll fires (2000ms interval)
   └─ Fetch connections request
\`\`\`

## Error Handling Flow

\`\`\`
User Action
   │
   ▼
Try Fetch Data
   │
   ├─ Success (200)
   │  └─ Update state with data
   │
   └─ Error (500, network, abort)
      │
      ├─ Abort? → Ignore (cleanup)
      │
      └─ Real Error?
         ├─ Set error state
         ├─ Show error message
         └─ Retry on next interval
\`\`\`

## Performance Considerations

### Memory Usage
\`\`\`
Packets: 1KB each × 1000 max     = ~1MB
Connections: 200 bytes × 100 max = ~20KB
State (hooks): ~100KB overhead
Total per instance: ~1.1MB
\`\`\`

### Network Bandwidth
\`\`\`
Packets endpoint:     ~50KB per request (50 packets)
Stats endpoint:       ~5KB per request
Connections endpoint: ~30KB per request

At default intervals:
- Packets: 50KB × (1000ms/500ms) = 100KB/s
- Stats:   5KB × (1000ms/1000ms) = 5KB/s
- Conn:    30KB × (1000ms/2000ms) = 15KB/s
Total: ~120KB/s maximum
\`\`\`

### CPU Usage
\`\`\`
Backend:
- Packet generation: ~0.1ms per packet
- At 300ms interval: ~0.1ms × 3-4 packets = 0.3-0.4ms

Frontend:
- State updates: ~10ms per update
- Re-renders: ~20-50ms depending on payload
- Filtering: ~5-10ms for 50 packets
\`\`\`

## Future Architecture Improvements

\`\`\`
Current (v2.0)
┌──────────────┐
│ In-Memory    │
│ Storage      │
└──────────────┘

v3.0 (Database)
┌──────────────┐
│ PostgreSQL/  │
│ MongoDB      │
└──────────────┘

v4.0 (Real-time)
┌──────────────┐
│ WebSocket    │
│ Server       │
└──────────────┘

v5.0 (Distributed)
┌──────────────┐     ┌──────────────┐
│ Message Bus  │────▶│ API Server   │
│ (Redis/Kafka)│     │ (Horizontal  │
└──────────────┘     │  scaling)    │
                     └──────────────┘
\`\`\`

---

For implementation details, see:
- `/app/api/packets/route.ts` - Backend API
- `/hooks/use-backend-packets.ts` - Frontend hooks
- `/lib/config.ts` - Configuration system
