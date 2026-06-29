/**
 * API Configuration
 * Uses local API endpoint with real network monitoring
 */

export const API_CONFIG = {
  // Use local API endpoint
  getApiUrl(): string {
    return ""
  },

  // Get packet endpoint - local route
  getPacketsEndpoint(): string {
    return "/api/packets"
  },
}

export function getApiUrl(): string {
  return API_CONFIG.getApiUrl()
}

export function getPacketsEndpoint(): string {
  return API_CONFIG.getPacketsEndpoint()
}
