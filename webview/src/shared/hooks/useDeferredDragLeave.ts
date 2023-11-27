import { useCallback, useEffect, useRef, useState } from 'react'

export const useDeferredDragLeave = () => {
  const [hoveringSomething, setHoveringSomething] = useState(false)
  const isHovering = useRef(false)
  const hoveringTimeout = useRef<number>(0)

  useEffect(() => {
    return () => {
      clearTimeout(hoveringTimeout.current)
    }
  }, [])

  const deferredDragLeave = useCallback(
    (callback?: () => void) => {
      isHovering.current = false
      hoveringTimeout.current = window.setTimeout(() => {
        if (!isHovering.current) {
          setHoveringSomething(false)
          callback?.()
        }
      }, 500)
    },
    [setHoveringSomething]
  )

  const immediateDragLeave = useCallback(() => {
    setHoveringSomething(false)
    isHovering.current = false
  }, [setHoveringSomething])

  const immediateDragEnter = useCallback(() => {
    setHoveringSomething(true)
    isHovering.current = true
  }, [setHoveringSomething])

  return {
    deferredDragLeave,
    hoveringSomething,
    immediateDragEnter,
    immediateDragLeave
  }
}
