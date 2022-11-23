import React, { useEffect, useRef, useState } from 'react'
import styles from './styles.module.scss'

interface ResizerProps {
  className: string
  onGrab: () => void
  onRelease: () => void
  onResize: (diff: number) => void
  snapPoints: number[]
  sizeBetweenResizers: number
  setIsExpanding: (isExpanding: boolean) => void
  currentSnapPoint: number
}

export const Resizer: React.FC<ResizerProps> = ({
  className,
  onGrab,
  onRelease,
  onResize,
  snapPoints,
  sizeBetweenResizers, // Plot + gap
  setIsExpanding,
  currentSnapPoint
}) => {
  const startingPageX = useRef(0)
  const [lockedX, setLockedX] = useState<number | undefined>(undefined)
  const [isResizing, setIsResizing] = useState(false)
  const lockedSnapPoint = useRef(currentSnapPoint)

  // eslint-disable-next-line sonarjs/cognitive-complexity
  useEffect(() => {
    const setSnapPoint = (snapPoint: number, isShrinking?: boolean) => {
      setLockedX(
        snapPoint -
          sizeBetweenResizers +
          20 * currentSnapPoint * (isShrinking ? -1 : 1)
      )
      setIsExpanding(!isShrinking)
      lockedSnapPoint.current = snapPoints.indexOf(snapPoint) + 1
    }
    const handleMouseMove = (e: MouseEvent) => {
      const newDiffX = e.clientX - startingPageX.current

      if (isResizing && newDiffX !== 0) {
        const positionX = newDiffX + sizeBetweenResizers
        const isShrinking = newDiffX < 0
        if (isShrinking) {
          for (let i = currentSnapPoint; i < snapPoints.length; i++) {
            const snapPoint = snapPoints[i]
            if (Math.abs(positionX) >= snapPoint) {
              setSnapPoint(snapPoint, true)
              break
            }
          }
        } else {
          for (let i = currentSnapPoint - 1; i >= 0; i--) {
            const snapPoint = snapPoints[i]
            if (positionX <= snapPoint) {
              setSnapPoint(snapPoint)
              break
            }
          }
        }
      }
    }

    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [
    currentSnapPoint,
    isResizing,
    snapPoints,
    setIsExpanding,
    sizeBetweenResizers
  ])

  useEffect(() => {
    const handleMouseUp = () => {
      if (isResizing) {
        setIsExpanding(false)
        onResize(lockedSnapPoint.current)
        onRelease()
        setLockedX(undefined)
        setIsResizing(false)
      }
    }

    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [onResize, onRelease, isResizing, setIsExpanding])

  const handleMouseDown = (e: React.MouseEvent) => {
    startingPageX.current = e.clientX
    setIsResizing(true)
    onGrab()
  }

  const lockedStyle = lockedX
    ? {
        right: Math.min(-lockedX, 0),
        width: Math.abs(lockedX)
      }
    : {}

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={className}
      onMouseDown={handleMouseDown}
      data-testid="vertical-plot-resizer"
    >
      {isResizing && (
        <div className={styles.resizerLocked} style={lockedStyle} />
      )}
    </div>
  )
}
