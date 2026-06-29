"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PacketStream } from "@/components/network/packet-stream"
import { PacketSearch } from "@/components/network/packet-search"
import { StatisticsChart } from "@/components/network/statistics-chart"
import { ProtocolFilters } from "@/components/network/protocol-filters"
import { ConnectionTracker } from "@/components/network/connection-tracker"
import { StatsOverview } from "@/components/network/stats-overview"
import { AdvancedStatsDashboard } from "@/components/network/advanced-stats-dashboard"
import { BandwidthMeter } from "@/components/network/bandwidth-meter"
import { TrafficMap } from "@/components/network/traffic-map"
import { TrafficHeatmap } from "@/components/network/traffic-heatmap"
import { ReplayControls } from "@/components/network/replay-controls"
import { usePacketStream } from "@/hooks/use-packet-stream"
import { useTrafficStats } from "@/hooks/use-traffic-stats"
import { usePacketReplay } from "@/hooks/use-packet-replay"
import { useBackendConnections } from "@/hooks/use-backend-packets"
import type { Connection } from "@/lib/types"
import { Play, Pause, Trash2, Download, Activity, Film, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ThreatAlerts } from "@/components/network/threat-alerts"
import { useThreatDetection } from "@/hooks/use-threat-detection"
import { BackendStatus } from "@/components/network/backend-status"

export default function NetworkAnalyzerPage() {
  const {
    packets,
    allPackets,
    activeFilters,
    searchQuery,
    isPaused,
    toggleFilter,
    clearFilters,
    setSearchQuery,
    togglePause,
    clearPackets,
  } = usePacketStream(300)

  const stats = useTrafficStats(allPackets)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("live")

  const replay = usePacketReplay(allPackets)
  const displayPackets = replay.isReplayMode ? replay.replayPackets : packets

  // Fetch real connections from backend
  const { connections, isLoading: connectionsLoading } = useBackendConnections({
    pollInterval: 2000,
    enabled: true,
  })

  const lastSuspiciousPacketRef = useRef<string | null>(null)

  useEffect(() => {
    const suspiciousPackets = packets.filter((p) => p.isSuspicious)
    if (suspiciousPackets.length > 0) {
      const latest = suspiciousPackets[0]
      const packetId = `${latest.timestamp}-${latest.sourceIp}-${latest.destIp}`

      // Only show toast if this is a new suspicious packet
      if (packetId !== lastSuspiciousPacketRef.current) {
        lastSuspiciousPacketRef.current = packetId
        toast({
          title: "Suspicious Activity Detected",
          description: `${latest.protocol} packet from ${latest.sourceIp}`,
          variant: "destructive",
        })
      }
    }
  }, [packets.length]) // Only trigger when packet count changes, not on every packet array change

  const handleExport = () => {
    const dataStr = JSON.stringify(allPackets, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `network-capture-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: `Exported ${allPackets.length} packets`,
    })
  }

  const maxBandwidth = 100000 // 100 KB/s for display

  const { alerts, dismissAlert, clearAllAlerts } = useThreatDetection(allPackets)

  return (
    <div className="min-h-screen text-foreground p-4 md:p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl flex items-center gap-3 text-white font-normal font-mono">
              <Activity className="w-8 h-8 text-foreground" strokeWidth={1} />
              Network Traffic Analyzer
            </h1>
            <p className="text-slate-400 mt-1">Real-time packet monitoring and analysis</p>
          </div>
          <div className="flex gap-2 items-center">
            <BackendStatus />
            <div className="flex gap-2">
              {!replay.isReplayMode ? (
                <>
                  <Button variant="outline" size="sm" onClick={togglePause} className="gap-2 bg-transparent text-white">
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearPackets} className="gap-2 bg-transparent text-white">
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={replay.enterReplayMode}
                    className="gap-2 bg-transparent text-white"
                    disabled={allPackets.length === 0}
                  >
                    <Film className="w-4 h-4" />
                    Replay
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={replay.exitReplayMode}
                  className="gap-2 bg-transparent text-white"
                >
                  <X className="w-4 h-4" />
                  Exit Replay
                </Button>
              )}
            </div>
          </div>
        </div>

        <StatsOverview stats={stats} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-1 flex justify-center">
            <BandwidthMeter label="Download" value={stats.bytesPerSecond} max={maxBandwidth} color="stroke-blue-500" />
          </div>
          <div className="col-span-2 md:col-span-1 flex justify-center">
            <BandwidthMeter
              label="Upload"
              value={stats.bytesPerSecond * 0.4}
              max={maxBandwidth}
              color="stroke-green-500"
            />
          </div>
          <div className="col-span-2 md:col-span-2">
            <ProtocolFilters
              activeFilters={activeFilters}
              onToggleFilter={toggleFilter}
              onClearFilters={clearFilters}
            />
          </div>
        </div>

        {replay.isReplayMode && (
          <ReplayControls
            isPlaying={replay.isPlaying}
            currentIndex={replay.currentIndex}
            totalPackets={allPackets.length}
            playbackSpeed={replay.playbackSpeed}
            onPlay={replay.play}
            onPause={replay.pause}
            onReset={replay.reset}
            onStepBackward={replay.stepBackward}
            onStepForward={replay.stepForward}
            onSpeedChange={replay.setPlaybackSpeed}
            onSeek={replay.seek}
          />
        )}

        {alerts.length > 0 && <ThreatAlerts alerts={alerts} onDismiss={dismissAlert} onClearAll={clearAllAlerts} />}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="live">Live Stream</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4">
            <PacketSearch value={searchQuery} onChange={setSearchQuery} />
            <PacketStream packets={displayPackets} />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <AdvancedStatsDashboard packets={allPackets} stats={stats} />
            <TrafficHeatmap packets={allPackets} />
            <StatisticsChart packets={allPackets} />
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            <ConnectionTracker connections={connections} />
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <TrafficMap packets={allPackets} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
