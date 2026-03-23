import { useEffect, useRef } from 'react'

/** Poll a fn every `interval` ms while `active` is true */
export function usePolling(fn: () => void, interval: number, active: boolean) {
  const savedFn = useRef(fn)
  useEffect(() => { savedFn.current = fn })
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => savedFn.current(), interval)
    return () => clearInterval(id)
  }, [active, interval])
}
