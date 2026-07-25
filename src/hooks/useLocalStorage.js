import { useState, useEffect, useCallback, useRef } from 'react'

export function useLocalStorage(key, initialValue) {
  const initialValueRef = useRef(initialValue)
  const keyRef = useRef(key)

  const read = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item != null ? JSON.parse(item) : initialValueRef.current
    } catch {
      return initialValueRef.current
    }
  }, [key])

  const [stored, setStored] = useState(read)

  // Re-read only when the storage key itself changes. Depending on
  // initialValue here causes an update loop when callers pass an object literal.
  useEffect(() => {
    if (keyRef.current === key) return
    keyRef.current = key
    setStored(read())
  }, [key, read])

  const setValue = useCallback(
    (value) => {
      setStored((prev) => {
        const next = typeof value === 'function' ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          /* ignore quota errors */
        }
        return next
      })
    },
    [key]
  )

  return [stored, setValue]
}
