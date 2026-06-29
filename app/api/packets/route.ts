import { NextRequest, NextResponse } from "next/server"
import { getRealNetworkMonitor, startRealNetworkMonitoring } from "@/lib/real-network-monitor"

export const maxDuration = 60

let monitoringStarted = false

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

async function ensureMonitoringStarted() {
  if (monitoringStarted) return

  try {
    monitoringStarted = true
    await startRealNetworkMonitoring()
    console.log("[v0] Real network monitoring started")
  } catch (error) {
    console.error("[v0] Real monitoring failed:", error)
    throw new Error("Network monitoring is unavailable. Ensure the system has proper permissions.")
  }
}



export async function GET(request: NextRequest) {
  try {
    await ensureMonitoringStarted()

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
    const offset = parseInt(searchParams.get("offset") || "0")

    const monitor = getRealNetworkMonitor()

    if (action === "packets") {
      const packets = monitor.getPackets(limit, offset)

      return NextResponse.json(
        {
          packets: packets || [],
          total: (packets || []).length,
          timestamp: Date.now(),
          source: "real",
        },
        { headers: corsHeaders }
      )
    }

    if (action === "connections") {
      const connections = monitor.getConnections(limit, offset)
      const allConnections = monitor.getAllConnections()

      return NextResponse.json(
        {
          connections: connections || [],
          total: (allConnections || []).length,
          timestamp: Date.now(),
          source: "real",
        },
        { headers: corsHeaders }
      )
    }

    if (action === "stats") {
      const stats = monitor.getStats()

      return NextResponse.json(
        {
          stats,
          timestamp: Date.now(),
          source: "real",
        },
        { headers: corsHeaders }
      )
    }

    if (action === "status") {
      const stats = monitor.getStats()
      return NextResponse.json(
        {
          status: {
            isActive: stats.isMonitoring,
            platform: stats.platform,
            packetsCount: stats.totalPackets,
          },
          timestamp: Date.now(),
          source: "real",
        },
        { headers: corsHeaders }
      )
    }

    // Default: return latest packets
    const packets = monitor.getPackets(limit, 0)

    return NextResponse.json(
      {
        packets,
        total: packets.length,
        timestamp: Date.now(),
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error("[v0] API Error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}
