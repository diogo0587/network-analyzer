# Integration Examples

This document shows how to integrate real network data sources into the Network Traffic Analyzer.

## 1. Integration with tcpdump (Linux/Mac)

### Setup

\`\`\`bash
# Install tcpdump if not present
sudo apt-get install tcpdump  # Linux
brew install tcpdump          # Mac

# Capture packets to a file
sudo tcpdump -i en0 -w capture.pcap
\`\`\`

### Node.js Integration

Create a service to read tcpdump output:

\`\`\`typescript
// lib/network-capture.ts
import { exec } from 'child_process'
import { promisify } from 'util'
import type { PacketHeader } from './types'

const execAsync = promisify(exec)

export async function capturePacketsFromTcpdump(): Promise<PacketHeader[]> {
  try {
    // Use tcpdump to capture packets
    const { stdout } = await execAsync(
      'sudo tcpdump -i any -c 10 -nn -q',
      { timeout: 5000 }
    )

    // Parse tcpdump output
    const packets: PacketHeader[] = []
    const lines = stdout.split('\n')

    for (const line of lines) {
      const packet = parseTcpdumpLine(line)
      if (packet) {
        packets.push(packet)
      }
    }

    return packets
  } catch (error) {
    console.error('Error capturing packets:', error)
    return []
  }
}

function parseTcpdumpLine(line: string): PacketHeader | null {
  // Example line: "IP 192.168.1.1.54321 > 8.8.8.8.443: Flags [S], seq 0"
  const regex = /IP (\d+\.\d+\.\d+\.\d+)\.(\d+) > (\d+\.\d+\.\d+\.\d+)\.(\d+).*Flags \[([A-Z.]+)\]/
  const match = line.match(regex)

  if (!match) return null

  const [, srcIp, srcPort, dstIp, dstPort, flags] = match

  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    sourceIp: srcIp,
    destIp: dstIp,
    sourcePort: parseInt(srcPort),
    destPort: parseInt(dstPort),
    protocol: determineProtocol(parseInt(dstPort)),
    size: Math.floor(Math.random() * 1500) + 64,
    flags: flags.split('.').filter(f => f),
    ttl: 64,
    isSuspicious: false,
    geolocation: { lat: 0, lng: 0, country: 'Unknown' },
    country: 'Unknown',
    city: 'Unknown',
  }
}

function determineProtocol(port: number): string {
  const portToProtocol: Record<number, string> = {
    443: 'HTTPS',
    80: 'HTTP',
    22: 'SSH',
    53: 'DNS',
    21: 'FTP',
  }
  return portToProtocol[port] || 'TCP'
}
\`\`\`

### API Route Integration

\`\`\`typescript
// app/api/packets/route.ts (updated)
import { capturePacketsFromTcpdump } from '@/lib/network-capture'

export async function GET(request: NextRequest) {
  if (request.headers.get('x-use-real-packets') === 'true') {
    // Use real tcpdump packets
    const realPackets = await capturePacketsFromTcpdump()
    return NextResponse.json({ packets: realPackets })
  }

  // Default: use generated packets
  // ... existing code
}
\`\`\`

## 2. Integration with Wireshark API

### Using tshark (Wireshark's CLI)

\`\`\`typescript
// lib/wireshark-capture.ts
import { exec } from 'child_process'
import { promisify } from 'util'
import type { PacketHeader } from './types'

const execAsync = promisify(exec)

export async function captureFromWireshark(): Promise<PacketHeader[]> {
  try {
    const { stdout } = await execAsync(
      'tshark -i any -c 50 -T json -e ip.src -e ip.dst -e tcp.srcport -e tcp.dstport -e ip.proto',
      { timeout: 10000 }
    )

    const packets = JSON.parse(stdout)
    return packets.map((pkt: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      sourceIp: pkt._source.layers.ip?.ip_src,
      destIp: pkt._source.layers.ip?.ip_dst,
      sourcePort: pkt._source.layers.tcp?.tcp_srcport,
      destPort: pkt._source.layers.tcp?.tcp_dstport,
      protocol: getProtocolName(pkt._source.layers.ip?.ip_proto),
      size: pkt._source.layers.frame?.frame_len || 0,
      flags: [],
      ttl: pkt._source.layers.ip?.ip_ttl || 64,
      isSuspicious: false,
      geolocation: { lat: 0, lng: 0, country: 'Unknown' },
      country: 'Unknown',
      city: 'Unknown',
    }))
  } catch (error) {
    console.error('Error capturing from Wireshark:', error)
    return []
  }
}

function getProtocolName(protoNum: string): string {
  const protocols: Record<string, string> = {
    '6': 'TCP',
    '17': 'UDP',
    '1': 'ICMP',
  }
  return protocols[protoNum] || 'OTHER'
}
\`\`\`

## 3. Integration with Network Monitoring Tool (Prometheus/Grafana)

### Using Prometheus API

\`\`\`typescript
// lib/prometheus-integration.ts
import type { PacketHeader } from './types'

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090'

export async function fetchFromPrometheus(): Promise<PacketHeader[]> {
  try {
    // Query Prometheus for network metrics
    const query = 'increase(network_packets_total[1m])'
    const response = await fetch(
      `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`
    )

    const data = await response.json()
    const packets: PacketHeader[] = []

    // Transform Prometheus metrics to packets
    for (const result of data.data.result) {
      const labels = result.metric
      packets.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        sourceIp: labels.src_ip || '0.0.0.0',
        destIp: labels.dst_ip || '0.0.0.0',
        sourcePort: parseInt(labels.src_port) || 0,
        destPort: parseInt(labels.dst_port) || 0,
        protocol: labels.protocol || 'TCP',
        size: parseInt(result.value[1]) || 0,
        flags: [],
        ttl: 64,
        isSuspicious: false,
        geolocation: { lat: 0, lng: 0, country: 'Unknown' },
        country: 'Unknown',
        city: 'Unknown',
      })
    }

    return packets
  } catch (error) {
    console.error('Error fetching from Prometheus:', error)
    return []
  }
}
\`\`\`

## 4. Integration with Cloud Provider APIs

### AWS CloudWatch

\`\`\`typescript
// lib/aws-network-integration.ts
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch'
import type { PacketHeader } from './types'

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION })

export async function fetchAWSNetworkMetrics(): Promise<PacketHeader[]> {
  try {
    const command = new GetMetricStatisticsCommand({
      Namespace: 'AWS/EC2',
      MetricName: 'NetworkPacketsIn',
      StartTime: new Date(Date.now() - 60000),
      EndTime: new Date(),
      Period: 60,
      Statistics: ['Sum'],
    })

    const response = await cloudwatch.send(command)
    const packets: PacketHeader[] = []

    // Transform CloudWatch metrics to packets
    response.Datapoints?.forEach((datapoint) => {
      if (datapoint.Sum) {
        packets.push({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: datapoint.Timestamp?.getTime() || Date.now(),
          sourceIp: '0.0.0.0', // Use actual source if available
          destIp: '0.0.0.0',
          sourcePort: 0,
          destPort: 0,
          protocol: 'TCP',
          size: datapoint.Sum,
          flags: [],
          ttl: 64,
          isSuspicious: false,
          geolocation: { lat: 0, lng: 0, country: 'Unknown' },
          country: 'Unknown',
          city: 'Unknown',
        })
      }
    })

    return packets
  } catch (error) {
    console.error('Error fetching AWS metrics:', error)
    return []
  }
}
\`\`\`

### Google Cloud Monitoring

\`\`\`typescript
// lib/gcp-network-integration.ts
import { MetricServiceClient } from '@google-cloud/monitoring'
import type { PacketHeader } from './types'

const client = new MetricServiceClient()

export async function fetchGCPNetworkMetrics(): Promise<PacketHeader[]> {
  const projectName = client.projectPath(process.env.GCP_PROJECT_ID!)

  try {
    const request = {
      name: projectName,
      filter: 'metric.type="compute.googleapis.com/instance/network/received_packets_count"',
      interval: {
        endTime: { seconds: Date.now() / 1000 },
        startTime: { seconds: (Date.now() - 60000) / 1000 },
      },
    }

    const [timeSeries] = await client.listTimeSeries(request)
    const packets: PacketHeader[] = []

    timeSeries.forEach((series) => {
      series.points?.forEach((point) => {
        if (point.value?.doubleValue) {
          packets.push({
            id: Math.random().toString(36).substr(2, 9),
            timestamp: point.interval?.endTime?.seconds
              ? point.interval.endTime.seconds * 1000
              : Date.now(),
            sourceIp: '0.0.0.0',
            destIp: '0.0.0.0',
            sourcePort: 0,
            destPort: 0,
            protocol: 'TCP',
            size: Math.floor(point.value.doubleValue),
            flags: [],
            ttl: 64,
            isSuspicious: false,
            geolocation: { lat: 0, lng: 0, country: 'Unknown' },
            country: 'Unknown',
            city: 'Unknown',
          })
        }
      })
    })

    return packets
  } catch (error) {
    console.error('Error fetching GCP metrics:', error)
    return []
  }
}
\`\`\`

## 5. Integration with VPN/Proxy Logs

### Parsing VPN Logs

\`\`\`typescript
// lib/vpn-logs-parser.ts
import * as fs from 'fs'
import * as readline from 'readline'
import type { PacketHeader } from './types'

export async function parseVPNLogs(logFilePath: string): Promise<PacketHeader[]> {
  const packets: PacketHeader[] = []

  const fileStream = fs.createReadStream(logFilePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    const packet = parseVPNLogLine(line)
    if (packet) {
      packets.push(packet)
    }
  }

  return packets
}

function parseVPNLogLine(line: string): PacketHeader | null {
  // Example: "2024-01-15 10:30:45 192.168.1.100:54321 -> 8.8.8.8:443 TCP"
  const regex = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (\d+\.\d+\.\d+\.\d+):(\d+) -> (\d+\.\d+\.\d+\.\d+):(\d+) (\w+)/
  const match = line.match(regex)

  if (!match) return null

  const [, timestamp, srcIp, srcPort, dstIp, dstPort, protocol] = match

  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date(timestamp).getTime(),
    sourceIp: srcIp,
    destIp: dstIp,
    sourcePort: parseInt(srcPort),
    destPort: parseInt(dstPort),
    protocol,
    size: Math.floor(Math.random() * 1500) + 64,
    flags: [],
    ttl: 64,
    isSuspicious: false,
    geolocation: { lat: 0, lng: 0, country: 'Unknown' },
    country: 'Unknown',
    city: 'Unknown',
  }
}
\`\`\`

## 6. Real-time Streaming via WebSocket

### Server-side WebSocket Handler

\`\`\`typescript
// lib/websocket-handler.ts
import { WebSocketServer } from 'ws'
import type { PacketHeader } from './types'

let wss: WebSocketServer

export function initializeWebSocket(server: any) {
  wss = new WebSocketServer({ server })

  wss.on('connection', (ws) => {
    console.log('Client connected')

    // Send packets every 500ms
    const interval = setInterval(() => {
      const packet = generatePacket()
      ws.send(JSON.stringify({ type: 'packet', data: packet }))
    }, 500)

    ws.on('close', () => {
      clearInterval(interval)
      console.log('Client disconnected')
    })
  })

  return wss
}

export function broadcastPacket(packet: PacketHeader) {
  if (wss) {
    wss.clients.forEach((client) => {
      client.send(JSON.stringify({ type: 'packet', data: packet }))
    })
  }
}
\`\`\`

### Client-side Hook

\`\`\`typescript
// hooks/use-websocket-packets.ts
import { useEffect, useState } from 'react'
import type { PacketHeader } from '@/lib/types'

export function useWebSocketPackets(url: string) {
  const [packets, setPackets] = useState<PacketHeader[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const ws = new WebSocket(url)

    ws.onopen = () => setIsConnected(true)
    ws.onclose = () => setIsConnected(false)

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'packet') {
        setPackets((prev) => [message.data, ...prev].slice(0, 100))
      }
    }

    return () => ws.close()
  }, [url])

  return { packets, isConnected }
}
\`\`\`

## Environment Variables

Add these to your `.env.local`:

\`\`\`env
# Real packet sources
USE_REAL_PACKETS=true
TCPDUMP_PATH=/usr/sbin/tcpdump
WIRESHARK_PATH=/usr/bin/tshark
PROMETHEUS_URL=http://localhost:9090

# Cloud providers
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

GCP_PROJECT_ID=your_project
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# WebSocket
WEBSOCKET_URL=ws://localhost:3000
\`\`\`

## Testing Real Integration

\`\`\`bash
# Test tcpdump integration
curl http://localhost:3000/api/packets?action=packets&real=true

# Test Prometheus integration
curl "http://localhost:3000/api/packets?action=packets&source=prometheus"

# Test WebSocket connection
wscat -c ws://localhost:3000
\`\`\`
