"use client"

import { useEffect, useCallback, useReducer } from "react"
import { useBackendPackets } from "./use-backend-packets"
import type { PacketHeader, Protocol } from "@/lib/types"

interface PacketState {
  packets: PacketHeader[]
  filteredPackets: PacketHeader[]
  activeFilters: Set<Protocol>
  searchQuery: string
  isPaused: boolean
  isLoading: boolean
}

type PacketAction =
  | { type: "SET_PACKETS"; packets: PacketHeader[] }
  | { type: "TOGGLE_FILTER"; protocol: Protocol }
  | { type: "CLEAR_FILTERS" }
  | { type: "SET_SEARCH"; query: string }
  | { type: "TOGGLE_PAUSE" }
  | { type: "CLEAR_PACKETS" }
  | { type: "LOAD_FILTERS"; filters: Set<Protocol> }
  | { type: "SET_LOADING"; loading: boolean }

const STORAGE_KEY = "network-analyzer-filters"

function filterPackets(packets: PacketHeader[], filters: Set<Protocol>, searchQuery: string): PacketHeader[] {
  let filtered = packets

  // Apply protocol filters
  if (filters.size > 0) {
    filtered = filtered.filter((p) => filters.has(p.protocol))
  }

  // Apply search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.sourceIp.toLowerCase().includes(query) ||
        p.destIp.toLowerCase().includes(query) ||
        p.sourcePort.toString().includes(query) ||
        p.destPort.toString().includes(query) ||
        p.protocol.toLowerCase().includes(query),
    )
  }

  return filtered
}

function packetReducer(state: PacketState, action: PacketAction): PacketState {
  switch (action.type) {
    case "SET_PACKETS": {
      const filteredPackets = filterPackets(action.packets, state.activeFilters, state.searchQuery)
      return { ...state, packets: action.packets, filteredPackets }
    }
    case "TOGGLE_FILTER": {
      const newFilters = new Set(state.activeFilters)
      if (newFilters.has(action.protocol)) {
        newFilters.delete(action.protocol)
      } else {
        newFilters.add(action.protocol)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newFilters)))
      const filteredPackets = filterPackets(state.packets, newFilters, state.searchQuery)
      return { ...state, activeFilters: newFilters, filteredPackets }
    }
    case "CLEAR_FILTERS": {
      localStorage.removeItem(STORAGE_KEY)
      const filteredPackets = filterPackets(state.packets, new Set(), state.searchQuery)
      return { ...state, activeFilters: new Set(), filteredPackets }
    }
    case "SET_SEARCH": {
      const filteredPackets = filterPackets(state.packets, state.activeFilters, action.query)
      return { ...state, searchQuery: action.query, filteredPackets }
    }
    case "TOGGLE_PAUSE": {
      return { ...state, isPaused: !state.isPaused }
    }
    case "CLEAR_PACKETS": {
      return { ...state, packets: [], filteredPackets: [] }
    }
    case "LOAD_FILTERS": {
      const filteredPackets = filterPackets(state.packets, action.filters, state.searchQuery)
      return { ...state, activeFilters: action.filters, filteredPackets }
    }
    case "SET_LOADING": {
      return { ...state, isLoading: action.loading }
    }
    default:
      return state
  }
}

export function usePacketStream(intervalMs = 500) {
  const [state, dispatch] = useReducer(packetReducer, {
    packets: [],
    filteredPackets: [],
    activeFilters: new Set(),
    searchQuery: "",
    isPaused: false,
    isLoading: true,
  })

  // Fetch packets from backend
  const { packets: backendPackets, isLoading } = useBackendPackets({
    pollInterval: intervalMs,
    enabled: !state.isPaused,
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const filters = new Set<Protocol>(JSON.parse(saved))
        dispatch({ type: "LOAD_FILTERS", filters })
      }
    } catch (error) {
      console.error("[v0] Failed to load filters:", error)
    }
  }, [])

  useEffect(() => {
    dispatch({ type: "SET_LOADING", loading: isLoading })
  }, [isLoading])

  useEffect(() => {
    if (backendPackets.length > 0) {
      dispatch({ type: "SET_PACKETS", packets: backendPackets })
    }
  }, [backendPackets])

  const toggleFilter = useCallback((protocol: Protocol) => {
    dispatch({ type: "TOGGLE_FILTER", protocol })
  }, [])

  const clearFilters = useCallback(() => {
    dispatch({ type: "CLEAR_FILTERS" })
  }, [])

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: "SET_SEARCH", query })
  }, [])

  const togglePause = useCallback(() => {
    dispatch({ type: "TOGGLE_PAUSE" })
  }, [])

  const clearPackets = useCallback(() => {
    dispatch({ type: "CLEAR_PACKETS" })
  }, [])

  return {
    packets: state.filteredPackets,
    allPackets: state.packets,
    activeFilters: state.activeFilters,
    searchQuery: state.searchQuery,
    isPaused: state.isPaused,
    isLoading: state.isLoading,
    toggleFilter,
    clearFilters,
    setSearchQuery,
    togglePause,
    clearPackets,
  }
}
