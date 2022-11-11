import React, { useEffect, useRef, useState, useCallback } from 'react'
import styles from './styles.module.scss'

interface ResizerProps {
  className: string
  onGrab: () => void
  onRelease: () => void
  onResize: (diff: number) => void
  snapPoints: number[]
  sizeBetweenResizers: number
  index: number
  setIsExpanding: (isExpanding: boolean) => void
}

export const Resizer: React.FC<ResizerProps> = ({
  className,
  onGrab,
  onRelease,
  onResize,
  snapPoints,
  sizeBetweenResizers, // Plot + gap
  index,
  setIsExpanding
}) => {
  const startingPageX = useRef(0)
  const [lockedX, setLockedX] = useState<number | undefined>(undefined)
  const [isResizing, setIsResizing] = useState(false)

  const getCurrentSnapPoint = useCallback(() => {
    for (const snapPoint of snapPoints) {
      if (
        snapPoint <= sizeBetweenResizers + 20 &&
        snapPoint >= sizeBetweenResizers - 20
      ) {
        return snapPoints.indexOf(snapPoint)
      }
    }
    return snapPoints.length - 1
  }, [snapPoints, sizeBetweenResizers])
  const lockedSnapPoint = useRef(getCurrentSnapPoint())
  const sizeFactor = sizeBetweenResizers * (index + 1)

  // eslint-disable-next-line sonarjs/cognitive-complexity
  useEffect(() => {
    const setSnapPoint = (snapPoint: number, isShrinking?: boolean) => {
      setLockedX(snapPoint - sizeFactor)
      setIsExpanding(!isShrinking)
      lockedSnapPoint.current = snapPoints.indexOf(snapPoint) + 1
    }
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newDiffX = e.clientX - startingPageX.current
        const positionX = newDiffX + sizeFactor
        const currentSnapPoint = getCurrentSnapPoint()
        const isShrinking = newDiffX < 0
        if (isShrinking) {
          for (let i = currentSnapPoint + 1; i < snapPoints.length; i++) {
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
  }, [getCurrentSnapPoint, isResizing, sizeFactor, snapPoints, setIsExpanding])

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
    ? { right: Math.min(-lockedX, 0), width: Math.abs(lockedX) }
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
