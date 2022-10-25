import React, { useEffect, useRef } from 'react'

interface ResizerProps {
  className: string
  horizontal?: boolean
  onGrab: () => void
  onRelease: () => void
  onResize: (diff: number) => void
}

export const Resizer: React.FC<ResizerProps> = ({
  className,
  horizontal,
  onGrab,
  onRelease,
  onResize
}) => {
  const startingPageX = useRef(0)
  const startingPageY = useRef(0)
  const isResizing = useRef(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing.current) {
        const diffX = e.pageX - startingPageX.current
        const diffY = e.pageY - startingPageY.current
        onResize(horizontal ? diffY : diffX)
      }
    }

    const handleMouseUp = () => {
      isResizing.current = false
      onRelease()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [onResize, horizontal, onRelease])

  const handleMouseDown = (e: React.MouseEvent) => {
    startingPageX.current = e.pageX
    startingPageY.current = e.pageY
    isResizing.current = true
    onGrab()
  }

  return <div className={className} onMouseDown={handleMouseDown} />
}
