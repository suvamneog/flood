/**
 * Central API helpers — data currently ships as static JSON via services.
 * Set VITE_API_BASE_URL when a live backend is available.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toUserError(error))
)

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

export default api
