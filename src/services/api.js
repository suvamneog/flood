/**
 * Shared API helpers. Live HTTP client removed until a backend exists
 * (set VITE_API_BASE_URL + reintroduce axios when needed; update CSP connect-src).
 */

/** Convert any thrown value into a safe, user-facing Error (no stack dumps). */
export function toUserError(err) {
  if (err?.name === 'UserFacingError') return err
  const message =
    err?.response?.status === 404
      ? 'The requested information could not be found.'
      : err?.response?.status >= 500
        ? 'Official data service is temporarily unavailable. Please try again shortly.'
        : err?.code === 'ECONNABORTED'
          ? 'The request timed out. Check your connection and try again.'
          : err?.message && !/^\s*at\s+/m.test(String(err.message))
            ? 'We could not load the latest flood data. Please try again.'
            : 'Something went wrong while loading data. Please try again.'

  const e = new Error(message)
  e.name = 'UserFacingError'
  return e
}
