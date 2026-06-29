"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import type { PacketHeader, TrafficStats } from "@/lib/types"
import { getPacketsEndpoint } from "@/lib/api-config"
import { fetchWithRetry } from "@/lib/backend-error-handler"

interface UseBackendPacketsOptions {
  pollInterval?: number
  enabled?: boolean
}

export function useBackendPackets({ pollInterval = 500, enabled = true }: UseBackendPacketsOptions = {}) {
  const [packets, setPackets] = useState<PacketHeader[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchPackets = useCallback(async () => {
    if (!enabled) return

    try {
      setError(null)

      const endpoint = getPacketsEndpoint()
      console.log("[v0] Fetching packets from:", endpoint)

      const response = await fetchWithRetry(`${endpoint}?action=packets&limit=50`, {
        maxRetries: 2,
        retryDelay: 500,
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      if (data && data.packets && Array.isArray(data.packets)) {
        setPackets(data.packets)
        console.log("[v0] Successfully received", data.packets.length, "packets")
      } else {
        console.warn("[v0] Invalid response format:", data)
        setPackets([])
      }
      setIsLoading(false)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was aborted, likely due to component unmount - ignore
        console.log("[v0] Fetch aborted (component unmounted)")
        return
      }
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("[v0] Failed to fetch packets:", message)
      setError(message)
      setPackets([])
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    fetchPackets()

    if (!enabled) return

    const interval = setInterval(fetchPackets, pollInterval)
    return () => clearInterval(interval)
  }, [fetchPackets, pollInterval, enabled])

  return { packets, isLoading, error, refetch: fetchPackets }
}

export function useBackendStats({ pollInterval = 1000, enabled = true }: UseBackendPacketsOptions = {}) {
  const [stats, setStats] = useState<TrafficStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchStats = useCallback(async () => {
    if (!enabled) return

    try {
      setError(null)

      const endpoint = getPacketsEndpoint()
      const response = await fetchWithRetry(`${endpoint}?action=stats`, {
        maxRetries: 2,
        retryDelay: 500,
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      if (data && data.stats) {
        setStats(data.stats)
      } else {
        console.warn("[v0] Invalid stats response:", data)
        setStats(null)
      }
      setIsLoading(false)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("[v0] Stats fetch aborted (component unmounted)")
        return
      }
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("[v0] Failed to fetch stats:", message)
      setError(message)
      setStats(null)
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    fetchStats()

    if (!enabled) return

    const interval = setInterval(fetchStats, pollInterval)
    return () => clearInterval(interval)
  }, [fetchStats, pollInterval, enabled])

  return { stats, isLoading, error, refetch: fetchStats }
}

export function useBackendConnections({ pollInterval = 2000, enabled = true }: UseBackendPacketsOptions = {}) {
  const [connections, setConnections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchConnections = useCallback(async () => {
    if (!enabled) return

    try {
      setError(null)

      const endpoint = getPacketsEndpoint()
      const response = await fetchWithRetry(`${endpoint}?action=connections&limit=50`, {
        maxRetries: 2,
        retryDelay: 500,
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      if (data && data.connections && Array.isArray(data.connections)) {
        setConnections(data.connections)
      } else {
        console.warn("[v0] Invalid connections response:", data)
        setConnections([])
      }
      setIsLoading(false)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("[v0] Connections fetch aborted (component unmounted)")
        return
      }
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("[v0] Failed to fetch connections:", message)
      setError(message)
      setConnections([])
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    fetchConnections()

    if (!enabled) return

    const interval = setInterval(fetchConnections, pollInterval)
    return () => clearInterval(interval)
  }, [fetchConnections, pollInterval, enabled])

  return { connections, isLoading, error, refetch: fetchConnections }
}
