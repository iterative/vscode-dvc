import { MutableRefObject, useEffect, useRef } from 'react'

const OPTIONS = { childList: true, subtree: true }

export const useMutationObserver = (
  targetEl: MutableRefObject<HTMLElement | null>,
  onChange: () => void
) => {
  const observer = useRef<MutationObserver | null>(null)

  useEffect(() => {
    if (targetEl.current && !observer.current) {
      observer.current = new MutationObserver(onChange)
      observer.current?.observe(targetEl.current, OPTIONS)
      onChange()
    }

    return () => {
      if (!observer.current) {
        return
      }

      observer.current.disconnect()
      observer.current = null
    }
  }, [observer, targetEl, onChange])
}
