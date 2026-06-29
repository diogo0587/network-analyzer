import type { PacketHeader } from "./types"

// Tipos para o pcap
interface PcapPacket {
  header: {
    tv_sec: number
    tv_usec: number
    incl_len: number
    orig_len: number
  }
  buf: Buffer
}

interface EthernetFrame {
  destMac: string
  srcMac: string
  type: number
}

interface IPv4Header {
  version: number
  headerLength: number
  totalLength: number
  identification: number
  flags: number
  fragmentOffset: number
  ttl: number
  protocol: number
  sourceIp: string
  destIp: string
}

interface TCPHeader {
  sourcePort: number
  destPort: number
  sequenceNumber: number
  ackNumber: number
  dataOffset: number
  flags: number
  windowSize: number
}

interface UDPHeader {
  sourcePort: number
  destPort: number
  length: number
}

class PcapHandler {
  private session: any = null
  private pcapLib: any = null
  private isInitialized = false
  private captureStartTime = Date.now()

  async initialize() {
    if (this.isInitialized) return

    try {
      // Tenta importar pcap dinamicamente
      try {
        this.pcapLib = require("pcap")
      } catch (e) {
        console.warn("[v0] pcap library not available, falling back to mock mode")
        return false
      }

      this.isInitialized = true
      return true
    } catch (error) {
      console.error("[v0] Failed to initialize pcap:", error)
      return false
    }
  }

  getNetworkInterfaces(): string[] {
    try {
      if (!this.pcapLib) return []
      // Retorna todas as interfaces de rede encontradas
      const devices = this.pcapLib.findalldevs()
      return devices.map((d: any) => d.name).filter((name: string) => !name.includes("lo"))
    } catch (error) {
      console.error("[v0] Failed to get network interfaces:", error)
      return []
    }
  }

  startCapture(interfaceName?: string): boolean {
    try {
      if (!this.pcapLib) return false

      const interfaces = this.getNetworkInterfaces()
      const selectedInterface = interfaceName || interfaces[0]

      if (!selectedInterface) {
        console.warn("[v0] No suitable network interface found")
        return false
      }

      this.session = this.pcapLib.createSession(selectedInterface, {
        filter: "tcp or udp",
        snapshot_length: 65535,
        buffersize: 10 * 1024 * 1024,
      })

      console.log(`[v0] Capturing packets on interface: ${selectedInterface}`)
      return true
    } catch (error) {
      console.error("[v0] Failed to start packet capture:", error)
      return false
    }
  }

  parsePacket(buf: Buffer): Partial<PacketHeader> | null {
    try {
      // Parse Ethernet frame
      const ethernet = this.parseEthernet(buf)
      if (!ethernet || ethernet.type !== 0x0800) {
        return null // Only process IPv4
      }

      // Parse IPv4 header
      const ipv4 = this.parseIPv4(buf.slice(14))
      if (!ipv4) return null

      // Parse transport layer (TCP/UDP)
      let protocol = "Unknown"
      let sourcePort = 0
      let destPort = 0

      if (ipv4.protocol === 6) {
        // TCP
        const tcp = this.parseTCP(buf.slice(14 + ipv4.headerLength * 4))
        if (tcp) {
          protocol = "TCP"
          sourcePort = tcp.sourcePort
          destPort = tcp.destPort
        }
      } else if (ipv4.protocol === 17) {
        // UDP
        const udp = this.parseUDP(buf.slice(14 + ipv4.headerLength * 4))
        if (udp) {
          protocol = "UDP"
          sourcePort = udp.sourcePort
          destPort = udp.destPort
        }
      }

      const size = ipv4.totalLength
      const latency = Math.random() * 50 + 10 // Simular latência realista

      return {
        id: this.generatePacketId(),
        sourceIp: ipv4.sourceIp,
        destIp: ipv4.destIp,
        sourcePort,
        destPort,
        protocol: protocol as any,
        size,
        latency,
        timestamp: Date.now(),
        isSuspicious: this.detectAnomalies(ipv4, sourcePort, destPort),
        location: {
          country: "Unknown",
          city: "Unknown",
          latitude: 0,
          longitude: 0,
        },
      }
    } catch (error) {
      console.error("[v0] Error parsing packet:", error)
      return null
    }
  }

  private parseEthernet(buf: Buffer): EthernetFrame | null {
    try {
      if (buf.length < 14) return null

      return {
        destMac: this.formatMac(buf.slice(0, 6)),
        srcMac: this.formatMac(buf.slice(6, 12)),
        type: buf.readUInt16BE(12),
      }
    } catch (error) {
      return null
    }
  }

  private parseIPv4(buf: Buffer): IPv4Header | null {
    try {
      if (buf.length < 20) return null

      const version = buf[0] >> 4
      if (version !== 4) return null

      const headerLength = (buf[0] & 0x0f) * 4
      const totalLength = buf.readUInt16BE(2)
      const ttl = buf[8]
      const protocol = buf[9]

      return {
        version,
        headerLength,
        totalLength,
        identification: buf.readUInt16BE(4),
        flags: buf[6] >> 5,
        fragmentOffset: (buf.readUInt16BE(6) & 0x1fff) * 8,
        ttl,
        protocol,
        sourceIp: `${buf[12]}.${buf[13]}.${buf[14]}.${buf[15]}`,
        destIp: `${buf[16]}.${buf[17]}.${buf[18]}.${buf[19]}`,
      }
    } catch (error) {
      return null
    }
  }

  private parseTCP(buf: Buffer): TCPHeader | null {
    try {
      if (buf.length < 20) return null

      return {
        sourcePort: buf.readUInt16BE(0),
        destPort: buf.readUInt16BE(2),
        sequenceNumber: buf.readUInt32BE(4),
        ackNumber: buf.readUInt32BE(8),
        dataOffset: (buf[12] >> 4) * 4,
        flags: buf[13],
        windowSize: buf.readUInt16BE(14),
      }
    } catch (error) {
      return null
    }
  }

  private parseUDP(buf: Buffer): UDPHeader | null {
    try {
      if (buf.length < 8) return null

      return {
        sourcePort: buf.readUInt16BE(0),
        destPort: buf.readUInt16BE(2),
        length: buf.readUInt16BE(4),
      }
    } catch (error) {
      return null
    }
  }

  private formatMac(buf: Buffer): string {
    return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join(":")
  }

  private generatePacketId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private detectAnomalies(ipv4: IPv4Header, srcPort: number, dstPort: number): boolean {
    // Detecção simples de anomalias
    const suspiciousPorts = [23, 21, 445, 135, 139] // Telnet, FTP, SMB, RPC
    const isCommonPort = [80, 443, 22, 53, 123].includes(dstPort)

    if (suspiciousPorts.includes(dstPort)) return true
    if (ipv4.flags & 0x02 && !isCommonPort) return true // Fragmented + unusual port
    if (srcPort > 49152 && dstPort < 1024 && !isCommonPort) return true // Unusual connection

    return false
  }

  getSession() {
    return this.session
  }

  stopCapture() {
    if (this.session) {
      try {
        this.session.close()
        this.session = null
      } catch (error) {
        console.error("[v0] Error closing capture session:", error)
      }
    }
  }
}

// Singleton instance
let handlerInstance: PcapHandler | null = null

export function getPcapHandler(): PcapHandler {
  if (!handlerInstance) {
    handlerInstance = new PcapHandler()
  }
  return handlerInstance
}

export async function initializePcapCapture(interfaceName?: string): Promise<boolean> {
  const handler = getPcapHandler()
  const initialized = await handler.initialize()

  if (initialized) {
    const started = handler.startCapture(interfaceName)
    return started
  }

  return false
}

export function getAvailableNetworkInterfaces(): string[] {
  const handler = getPcapHandler()
  return handler.getNetworkInterfaces()
}

export function parsePacketFromBuffer(buf: Buffer): Partial<PacketHeader> | null {
  const handler = getPcapHandler()
  return handler.parsePacket(buf)
}

export function stopPcapCapture() {
  const handler = getPcapHandler()
  handler.stopCapture()
}
