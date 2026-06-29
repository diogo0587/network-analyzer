# Error Handling & Console Error Management Guide

## Overview

This guide documents the comprehensive error handling strategy implemented to manage console errors, API failures, and graceful degradation in production.

---

## Architecture

### Error Handling Flow

\`\`\`
API Request
    ↓
fetchWithRetry (with exponential backoff)
    ├→ Attempt 1
    │  ↓ (fail)
    ├→ Attempt 2 (delay: 500ms)
    │  ↓ (fail)
    └→ Attempt 3 (delay: 1000ms)
       ↓ (fail)
       ↓
createBackendError (classify error)
    ↓
isRetryableError (check if worth retrying)
    ↓
logError (structured logging)
    ↓
setError (update UI state)
\`\`\`

### Components

#### 1. `lib/backend-error-handler.ts`

Provides core error handling functions:

**Functions:**
- `classifyError(error, statusCode)` - Categorizes error type
- `isRetryableError(error)` - Determines if retry should occur
- `createBackendError(error, statusCode, retryCount)` - Constructs structured error
- `fetchWithRetry(url, options)` - Fetches with automatic retry logic
- `logError(error, context)` - Structured logging

**Error Types:**
- `network` - Connection failed (retryable)
- `timeout` - Request timeout (retryable)
- `cors` - Cross-origin error (usually not retryable)
- `server` - HTTP 5xx error (retryable)
- `parse` - JSON parse error (not retryable)
- `unknown` - Other errors (not retryable)

**Retry Strategy:**
- Max 3 attempts (configurable)
- Exponential backoff: delay × 2^attempt
- 5 second request timeout
- Auto-abort on failure

#### 2. `hooks/use-backend-packets.ts`

Three hooks with unified error handling:

\`\`\`typescript
// All use the same pattern:
1. useBackendPackets() - Fetches real-time packets
2. useBackendStats() - Fetches traffic statistics
3. useBackendConnections() - Fetches active connections

// Each hook:
- Uses fetchWithRetry for resilient requests
- Implements consistent error handling
- Sets error state for UI
- Logs with [v0] prefix
- Handles AbortController cleanup
\`\`\`

---

## Error Types & Handling

### Network Errors

**Cause:** Backend unreachable, DNS failure, connection reset

**Detection:**
\`\`\`
"Failed to fetch"
"Network request failed"
\`\`\`

**Handling:**
- Retried up to 3 times with exponential backoff
- 5 second timeout between attempts
- User sees "Backend unavailable" message

**Example:**
\`\`\`
[v0] Fetch attempt 1/3 to https://v0-network-traffic-analyzer-w-moc.onrender.com/api/packets
[v0] Fetch attempt 1 failed: Failed to fetch
[v0] Fetch attempt 2 to https://v0-network-traffic-analyzer-w-moc.onrender.com/api/packets
[v0] Fetch attempt 2 failed: Failed to fetch
[v0] Fetch attempt 3 to https://v0-network-traffic-analyzer-w-moc.onrender.com/api/packets
[v0] Fetch attempt 3 failed: Failed to fetch
[v0] Failed to fetch packets after retries: Failed to fetch
\`\`\`

### Timeout Errors

**Cause:** Backend slow, network latency, stuck connection

**Detection:**
\`\`\`
AbortError (triggered by timeout)
\`\`\`

**Handling:**
- 5 second hard timeout per request
- Retried with backoff
- User sees spinner + error message

### Server Errors (5xx)

**Cause:** Backend crashed, resource limit, database error

**Detection:**
\`\`\`
HTTP 500, 502, 503, 504
\`\`\`

**Handling:**
- Retried with exponential backoff
- Logged with HTTP status code
- Graceful UI degradation

### CORS Errors

**Cause:** Backend CORS headers missing or misconfigured

**Detection:**
\`\`\`
"CORS error"
"Access-Control-Allow-Origin"
\`\`\`

**Handling:**
- Not retried (CORS issue persists)
- Logged prominently
- User sees clear error message

### Parse Errors

**Cause:** Invalid JSON response, corrupted data

**Detection:**
\`\`\`
"JSON.parse" or similar
\`\`\`

**Handling:**
- Not retried (data is corrupted)
- Error logged with response data
- User sees "Invalid response" message

---

## Console Logging Format

All logs use consistent prefix: `[v0]`

### Log Levels

**Info (fetch attempt):**
\`\`\`
[v0] Fetch attempt 1/3 to https://...
[v0] Successfully received 42 packets
\`\`\`

**Warning (retryable failure):**
\`\`\`
[v0] Fetch attempt 1 failed: Failed to fetch
[v0] Server error 503, retrying in 500ms
\`\`\`

**Error (permanent failure):**
\`\`\`
[v0] Failed to fetch packets after retries: Failed to fetch
[v0] Backend Error (packets) [network] HTTP 502
\`\`\`

### Debug Information

When debugging, logs show:
- Attempt number and total attempts
- Time spent per attempt
- Error classification
- HTTP status codes (if applicable)
- Retry delays
- Final outcome

---

## Error Detection Tests

### Test 1: Backend Connectivity
\`\`\`bash
curl -s -m 10 "https://v0-network-traffic-analyzer-w-moc.onrender.com/api/packets?action=status"
\`\`\`
Expected: HTTP 200 with JSON response

### Test 2: Error Handler Functions
Verify all functions exist in `lib/backend-error-handler.ts`:
- ✓ fetchWithRetry
- ✓ classifyError
- ✓ isRetryableError
- ✓ createBackendError
- ✓ logError

### Test 3: Hook Consistency
Verify all hooks use:
- ✓ getPacketsEndpoint() (unified endpoint)
- ✓ fetchWithRetry (retry logic)
- ✓ [v0] logging prefix
- ✓ setError state (for UI)

### Test 4: Error Logging
Verify logs contain:
- ✓ [v0] prefix for all messages
- ✓ Error classification
- ✓ Attempt counts
- ✓ HTTP status codes (if applicable)

### Test 5: Retry Logic
Verify exponential backoff:
- Attempt 1: immediate
- Attempt 2: ~500ms delay
- Attempt 3: ~1000ms delay

### Test 6: Error Classification
Verify all error types handled:
- ✓ network → retryable
- ✓ timeout → retryable
- ✓ cors → not retryable
- ✓ server → retryable
- ✓ parse → not retryable
- ✓ unknown → not retryable

---

## Troubleshooting

### Issue: "Failed to fetch" errors in console

**Root Cause:** Backend unreachable

**Fix:**
1. Verify Render backend is running
2. Check backend URL in `lib/api-config.ts`
3. Verify CORS headers in backend
4. Check browser network tab (should show 3 attempts)

**Evidence of proper retry:**
- Console shows 3 fetch attempts
- Exponential backoff delays observed
- Final error logged after all retries exhausted

### Issue: Repeated error logs in console

**Root Cause:** Normal behavior when backend unavailable

**Fix:**
- This is expected and indicates retry logic is working
- Check if backend is actually running
- UI still displays gracefully

**What's Working:**
- ✓ Error is caught and logged
- ✓ Retry logic triggered
- ✓ Component renders error state
- ✓ No error cascades

### Issue: Console shows "CORS error"

**Root Cause:** Backend CORS headers missing

**Fix (in backend):**
\`\`\`typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}
\`\`\`

**Note:** This error will NOT retry (CORS is configuration issue)

### Issue: "Invalid response" message

**Root Cause:** Backend returned non-JSON or corrupted data

**Fix:**
1. Check backend is returning valid JSON
2. Verify response structure has `packets`, `stats`, or `connections` field
3. Check for proxy/middleware that might modify response

---

## Production Verification

### Pre-Deployment Checklist

- [x] `lib/backend-error-handler.ts` exists with all functions
- [x] All hooks use `fetchWithRetry`
- [x] Unified endpoint via `getPacketsEndpoint()`
- [x] Consistent `[v0]` logging
- [x] Error state updates UI
- [x] Retry logic with exponential backoff
- [x] Timeout set to 5 seconds
- [x] Max retries set to 3
- [x] TypeScript types defined
- [x] No console errors in error handler itself

### Post-Deployment Verification

1. **Check browser console for patterns:**
   - Should see `[v0]` messages
   - Should see retry attempts if backend slow
   - No red error spikes without `[v0]` prefix

2. **Verify error states render:**
   - Component shows error message
   - Retry button functional (if provided)
   - UI doesn't crash

3. **Monitor Render backend:**
   - Check dashboard for request logs
   - Verify CORS headers present
   - Check response times

4. **Test error scenarios:**
   - Backend down: Should see 3 retries, then graceful error
   - Backend slow: Should see exponential backoff
   - CORS misconfigured: Should see single attempt, clear error
   - Corrupted data: Should see parse error, no retry

---

## Testing Error Scenarios

### Scenario 1: Backend Completely Down

**Expected behavior:**
1. Initial fetch fails
2. Retries with delays: 500ms, 1000ms
3. Final error logged
4. UI shows error state
5. No cascading errors

**Console output:**
\`\`\`
[v0] Fetch attempt 1/3 to https://...
[v0] Fetch attempt 1 failed: Failed to fetch
[v0] Fetch attempt 2/3 to https://...
[v0] Fetch attempt 2 failed: Failed to fetch
[v0] Fetch attempt 3/3 to https://...
[v0] Fetch attempt 3 failed: Failed to fetch
[v0] Failed to fetch packets after retries: Failed to fetch
\`\`\`

### Scenario 2: Slow Backend (recovers on retry)

**Expected behavior:**
1. First attempt times out after 5s
2. Retries with delay
3. Second or third attempt succeeds
4. UI updates with data
5. No error state shown

**Console output:**
\`\`\`
[v0] Fetch attempt 1/3 to https://...
[v0] Fetch attempt 1 failed: [timeout]
[v0] Fetch attempt 2/3 to https://... (after 500ms delay)
[v0] Successfully received 42 packets
\`\`\`

### Scenario 3: CORS Misconfigured

**Expected behavior:**
1. Single fetch attempt fails
2. Error identified as CORS
3. Not retried (CORS issue won't resolve)
4. Clear error message shown
5. User knows to fix backend configuration

**Console output:**
\`\`\`
[v0] Fetch attempt 1/3 to https://...
[v0] Fetch attempt 1 failed: CORS error
[v0] Failed to fetch packets after retries: CORS error
\`\`\`

---

## Key Improvements Made

### Before
- ❌ Failed fetch errors without retry
- ❌ Inconsistent error handling across hooks
- ❌ No error classification or timeout
- ❌ Unclear console logging
- ❌ UI could crash on error

### After
- ✅ Automatic retry with exponential backoff
- ✅ Unified error handling strategy
- ✅ Error classification for smart handling
- ✅ 5 second timeout per request
- ✅ Structured logging with context
- ✅ Graceful UI error states
- ✅ TypeScript type safety
- ✅ Production-ready error management

---

## Running Tests

\`\`\`bash
# Make verification script executable
chmod +x scripts/test-error-handling.sh

# Run comprehensive error handling tests
bash scripts/test-error-handling.sh
\`\`\`

Expected output:
- ✓ Backend is reachable (if running)
- ✓ All error handler functions exist
- ✓ All hooks use unified endpoint
- ✓ Error logging implemented
- ✓ Retry logic configured
- ✓ Error classification complete
- ✓ Ready for production

---

## Summary

The application now has **robust, production-ready error handling** that:

1. **Automatically retries transient failures** with exponential backoff
2. **Classifies errors intelligently** to determine retry strategy
3. **Logs consistently** for debugging and monitoring
4. **Handles timeouts** with 5 second hard limit
5. **Updates UI gracefully** when errors occur
6. **Prevents error cascades** with proper abort handling
7. **Provides clear user feedback** for all error states

All console errors are now managed effectively without generating additional errors during runtime.
