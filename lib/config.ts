/**
 * Configuration for Network Traffic Analyzer
 * 
 * Control whether to use backend API or mock data
 */

export const CONFIG = {
  /**
   * Enable real backend API
   * Always uses /api/packets endpoints with real network monitoring
   */
  USE_BACKEND_API: true,

  /**
   * Polling intervals (in milliseconds)
   */
  POLLING_INTERVALS: {
    PACKETS: 500,      // How often to fetch new packets
    STATS: 1000,       // How often to fetch statistics
    CONNECTIONS: 2000, // How often to fetch connections
  },

  /**
   * Data limits
   */
  DATA_LIMITS: {
    MAX_PACKETS_DISPLAYED: 50,    // Packets shown in UI
    MAX_PACKETS_STORED: 1000,     // Total packets kept in memory
    MAX_CONNECTIONS_STORED: 100,  // Total connections kept in memory
  },

  /**
   * Network monitoring settings
   */
  NETWORK_MONITORING: {
    INTERVAL_MS: 2000,         // Network data capture interval
    MAX_PACKETS_BUFFER: 500,   // Max packets in memory
  },

  /**
   * Feature flags
   */
  FEATURES: {
    THREAT_DETECTION: true,
    PACKET_REPLAY: true,
    EXPORT_FUNCTIONALITY: true,
    GEO_MAPPING: true,
  },
} as const

export type Config = typeof CONFIG

/**
 * Helper to check if using backend API
 */
export function isUsingBackendAPI(): boolean {
  return CONFIG.USE_BACKEND_API
}

/**
 * Get polling interval for a specific data type
 */
export function getPollingInterval(type: "packets" | "stats" | "connections"): number {
  return CONFIG.POLLING_INTERVALS[type.toUpperCase() as keyof typeof CONFIG.POLLING_INTERVALS]
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof CONFIG.FEATURES): boolean {
  return CONFIG.FEATURES[feature]
}
