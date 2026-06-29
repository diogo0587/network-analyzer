/**
 * Backend Error Handler
 * Manages API errors with retry logic, detailed logging, and graceful degradation
 */

export interface BackendError {
  type: "network" | "timeout" | "cors" | "server" | "parse" | "unknown"
  message: string
  statusCode?: number
  originalError?: Error
  timestamp: number
  retryCount: number
  isRetryable: boolean
}

const ERROR_TYPE_MAP: Record<string, BackendError["type"]> = {
  "Failed to fetch": "network",
  "Network request failed": "network",
  "timeout": "timeout",
  "CORS": "cors",
  "5": "server",
  "4": "server",
}

export function classifyError(error: Error | string, statusCode?: number): BackendError["type"] {
  const message = typeof error === "string" ? error : error.message

  for (const [key, type] of Object.entries(ERROR_TYPE_MAP)) {
    if (message.includes(key)) return type
  }

  if (statusCode) {
    if (statusCode >= 500) return "server"
    if (statusCode >= 400) return "server"
  }

  return "unknown"
}

export function isRetryableError(error: BackendError): boolean {
  const retryableTypes: BackendError["type"][] = ["network", "timeout", "server"]
  return retryableTypes.includes(error.type)
}

export function createBackendError(
  error: Error | string,
  statusCode?: number,
  retryCount = 0
): BackendError {
  const message = typeof error === "string" ? error : error.message
  const type = classifyError(error, statusCode)

  return {
    type,
    message,
    statusCode,
    originalError: typeof error === "string" ? undefined : error,
    timestamp: Date.now(),
    retryCount,
    isRetryable: retryableTypes.includes(type),
  }
}

const retryableTypes: BackendError["type"][] = ["network", "timeout", "server"]

export async function fetchWithRetry(
  url: string,
  options: RequestInit & { maxRetries?: number; retryDelay?: number } = {}
): Promise<Response> {
  const { maxRetries = 3, retryDelay = 1000, ...fetchOptions } = options
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let timeoutId: NodeJS.Timeout | null = null
    let controller: AbortController | null = null

    try {
      console.log(`[v0] Fetch attempt ${attempt + 1}/${maxRetries + 1} to ${url}`)

      controller = new AbortController()
      timeoutId = setTimeout(() => {
        if (controller) controller.abort()
      }, 5000) // 5s timeout

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      // Always clear timeout before using response
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      if (!response.ok) {
        if (response.status >= 500 || response.status === 429) {
          // Server error or rate limit - retry
          if (attempt < maxRetries) {
            const delay = retryDelay * Math.pow(2, attempt) // exponential backoff
            console.warn(`[v0] Server error ${response.status}, retrying in ${delay}ms`)
            await new Promise((resolve) => setTimeout(resolve, delay))
            continue
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (err) {
      // Always clean up timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      // Check if this is an AbortError from timeout
      if (err instanceof Error && err.name === "AbortError") {
        lastError = new Error("Request timeout (5s)")
        console.warn(`[v0] Fetch attempt ${attempt + 1} timed out after 5s`)
      } else {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.warn(`[v0] Fetch attempt ${attempt + 1} failed:`, lastError.message)
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error(`[v0] Fetch failed permanently after ${maxRetries + 1} attempts:`, lastError.message)
        throw lastError
      }

      // Otherwise wait and retry
      const delay = retryDelay * Math.pow(2, attempt)
      console.log(`[v0] Retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error("Fetch failed after retries")
}

export function logError(error: BackendError, context: string = ""): void {
  const contextStr = context ? ` (${context})` : ""
  console.error(
    `[v0] Backend Error${contextStr} [${error.type}] Attempt ${error.retryCount}: ${error.message}`
  )

  if (error.statusCode) {
    console.error(`[v0] HTTP Status: ${error.statusCode}`)
  }
}
