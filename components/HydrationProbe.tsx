"use client"
import { useEffect } from 'react'

/**
 * Development-only hydration & runtime error probe.
 * Logs when mounted and captures global errors so we can see if a client error is preventing
 * sections from rendering. Remove once issue is resolved.
 */
export function HydrationProbe() {
  useEffect(() => {
    const mark = Date.now()
    // eslint-disable-next-line no-console
    console.log('[HydrationProbe] mounted @', new Date(mark).toISOString())
    const onError = (e: ErrorEvent) => {
      // eslint-disable-next-line no-console
      console.error('[HydrationProbe] window.error', e.message, e.error)
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      // eslint-disable-next-line no-console
      console.error('[HydrationProbe] unhandledrejection', e.reason)
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
  return null
}

export default HydrationProbe
