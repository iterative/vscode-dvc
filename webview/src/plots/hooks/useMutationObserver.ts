import { useEffect, useState } from 'react'

const OPTIONS = { childList: true, subtree: true }

export const useMutationObserver = (
  targetEl: Node | null,
  onChange: () => void
) => {
  const [observer, setObserver] = useState<MutationObserver | undefined>(
    undefined
  )

  useEffect(() => {
    if (!observer) {
      const obs = new MutationObserver(onChange)
      setObserver(obs)
    }

    if (observer && targetEl) {
      observer.observe(targetEl, OPTIONS)
    }

    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [observer, targetEl, onChange])
}
