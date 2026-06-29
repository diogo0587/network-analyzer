import { getPcapHandler, initializePcapCapture, getAvailableNetworkInterfaces } from "./pcap-handler"
import type { PacketHeader } from "./types"

interface CaptureStats {
  mode: "real"
  interface?: string
  packetsCount: number
  startTime: number
  isActive: boolean
}

class RealPacketCapture {
  private stats: CaptureStats = {
    mode: "real",
    packetsCount: 0,
    startTime: Date.now(),
    isActive: false,
  }
  private packetBuffer: PacketHeader[] = []
  private maxBufferSize = 1000
  private pcapListener: ((packet: PacketHeader) => void) | null = null

  async initialize(): Promise<boolean> {
    console.log("[v0] Initializing real packet capture...")

    try {
      const initialized = await initializePcapCapture()
      if (initialized) {
        this.stats.isActive = true
        console.log("[v0] Real packet capture initialized successfully")
        return true
      }
      throw new Error("Failed to initialize pcap capture")
    } catch (error) {
      console.error("[v0] Real packet capture failed:", error)
      throw new Error("Network capture is unavailable. Ensure proper system permissions.")
    }
  }

  startCapture(onPacket?: (packet: PacketHeader) => void): void {
    if (this.stats.isActive) return

    this.stats.isActive = true
    this.stats.startTime = Date.now()
    this.pcapListener = onPacket || null

    this.startRealCapture()
  }

  private startRealCapture(): void {
    const handler = getPcapHandler()
    const session = handler.getSession()

    if (!session) {
      console.error("[v0] Real capture session not available")
      throw new Error("Capture session unavailable")
    }

    try {
      session.on("packet", (raw: any) => {
        const packet = handler.parsePacket(raw.buf)
        if (packet) {
          const fullPacket: PacketHeader = {
            id: packet.id || `pkt-${Date.now()}`,
            sourceIp: packet.sourceIp || "0.0.0.0",
            destIp: packet.destIp || "0.0.0.0",
            sourcePort: packet.sourcePort || 0,
            destPort: packet.destPort || 0,
            protocol: packet.protocol || "Unknown",
            size: packet.size || 0,
            latency: packet.latency || 0,
            timestamp: packet.timestamp || Date.now(),
            isSuspicious: packet.isSuspicious || false,
            location: packet.location || {
              country: "Unknown",
              city: "Unknown",
              latitude: 0,
              longitude: 0,
            },
          }

          this.addPacketToBuffer(fullPacket)

          if (this.pcapListener) {
            this.pcapListener(fullPacket)
          }
        }
      })

      session.on("complete", () => {
        console.log("[v0] Packet capture session completed")
        this.stats.isActive = false
      })

      console.log("[v0] Real packet capture started")
    } catch (error) {
      console.error("[v0] Error in real capture:", error)
      throw error
    }
  }

  stopCapture(): void {
    this.stats.isActive = false
    console.log("[v0] Packet capture stopped")
  }

  private addPacketToBuffer(packet: PacketHeader): void {
    this.packetBuffer.unshift(packet)
    if (this.packetBuffer.length > this.maxBufferSize) {
      this.packetBuffer.pop()
    }
    this.stats.packetsCount++
  }

  getPackets(limit = 100, offset = 0): PacketHeader[] {
    return this.packetBuffer.slice(offset, offset + limit)
  }

  getAllPackets(): PacketHeader[] {
    return [...this.packetBuffer]
  }

  clearBuffer(): void {
    this.packetBuffer = []
    this.stats.packetsCount = 0
  }

  getStats(): CaptureStats {
    return {
      ...this.stats,
      interface: getAvailableNetworkInterfaces()[0],
    }
  }

  getAvailableInterfaces(): string[] {
    return getAvailableNetworkInterfaces()
  }
}

// Singleton instance
let captureInstance: RealPacketCapture | null = null

export function getPacketCapture(): RealPacketCapture {
  if (!captureInstance) {
    captureInstance = new RealPacketCapture()
  }
  return captureInstance
}

export async function initializeCapture(): Promise<boolean> {
  const capture = getPacketCapture()
  return capture.initialize()
}

export function startCapture(onPacket?: (packet: PacketHeader) => void): void {
  const capture = getPacketCapture()
  capture.startCapture(onPacket)
}

export function stopCapture(): void {
  const capture = getPacketCapture()
  capture.stopCapture()
}

export function getCaptureStats(): CaptureStats {
  const capture = getPacketCapture()
  return capture.getStats()
}
