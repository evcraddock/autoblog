import { useEffect, useRef, useCallback } from 'react'

export interface AnnouncementOptions {
  priority?: 'polite' | 'assertive'
  delay?: number
  clearPrevious?: boolean
}

export function useAnnouncement(options: AnnouncementOptions = {}) {
  const { priority = 'polite', delay = 0, clearPrevious = false } = options
  const announcerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create announcer element if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div')
      announcer.setAttribute('aria-live', priority)
      announcer.setAttribute('aria-atomic', 'true')
      announcer.setAttribute('aria-relevant', 'all')
      announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `
      document.body.appendChild(announcer)
      announcerRef.current = announcer
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current)
        announcerRef.current = null
      }
    }
  }, [priority])

  const announce = useCallback(
    (message: string) => {
      if (!announcerRef.current) return

      const announcer = announcerRef.current

      const makeAnnouncement = () => {
        if (clearPrevious) {
          announcer.textContent = ''
          // Small delay to ensure screen reader notices the change
          setTimeout(() => {
            announcer.textContent = message
          }, 10)
        } else {
          announcer.textContent = message
        }
      }

      if (delay > 0) {
        setTimeout(makeAnnouncement, delay)
      } else {
        makeAnnouncement()
      }
    },
    [delay, clearPrevious]
  )

  return announce
}

export function useErrorAnnouncement() {
  const announce = useAnnouncement({
    priority: 'assertive',
    delay: 100,
    clearPrevious: true,
  })

  const announceError = useCallback(
    (error: Error, context?: string) => {
      const message = context
        ? `Error in ${context}: ${error.message}`
        : `Error: ${error.message}`

      announce(message)
    },
    [announce]
  )

  return announceError
}

export function useLoadingAnnouncement() {
  const announce = useAnnouncement({
    priority: 'polite',
    delay: 500,
    clearPrevious: true,
  })

  const announceLoading = useCallback(
    (isLoading: boolean, context?: string) => {
      if (isLoading) {
        const message = context ? `Loading ${context}...` : 'Loading...'
        announce(message)
      } else {
        const message = context ? `${context} loaded` : 'Loading complete'
        announce(message)
      }
    },
    [announce]
  )

  return announceLoading
}

export function useSuccessAnnouncement() {
  const announce = useAnnouncement({
    priority: 'polite',
    delay: 0,
    clearPrevious: true,
  })

  const announceSuccess = useCallback(
    (message: string) => {
      announce(`Success: ${message}`)
    },
    [announce]
  )

  return announceSuccess
}

export default useAnnouncement
