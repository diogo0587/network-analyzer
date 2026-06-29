"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Server, AlertCircle, Wifi } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getPacketsEndpoint } from "@/lib/api-config"

interface CaptureStatus {
  isActive: boolean
  interface?: string
  packetsCount: number
  platform: string
}

export function BackendStatus() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<CaptureStatus | null>(null)

  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        setIsLoading(true)
        const endpoint = getPacketsEndpoint()
        const response = await fetch(`${endpoint}?action=status`)

        if (response.ok) {
          const data = await response.json()
          setStatus(data.status)
          setIsConnected(true)
          setError(null)
        } else {
          setIsConnected(false)
          setError(`HTTP ${response.status}`)
        }
      } catch (err) {
        setIsConnected(false)
        setError(err instanceof Error ? err.message : "Connection failed")
      } finally {
        setIsLoading(false)
      }
    }

    checkBackendConnection()
    // Check connection every 30 seconds
    const interval = setInterval(checkBackendConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        Checking...
      </Badge>
    )
  }

  if (!isConnected) {
    return (
      <Badge variant="destructive" className="gap-2">
        <AlertCircle className="w-3 h-3" />
        Offline: {error || "No connection"}
      </Badge>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="default" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Wifi className="w-3 h-3" />
            Real Monitoring
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="space-y-1 text-xs">
          <p className="font-semibold">Real Network Monitor</p>
          <p>Platform: {status?.platform || "linux"}</p>
          <p>Status: {status?.isActive ? "Active" : "Idle"}</p>
          <p>Packets: {status?.packetsCount || 0}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
