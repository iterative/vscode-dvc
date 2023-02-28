import React, {
  createRef,
  CSSProperties,
  useEffect,
  useRef,
  useState
} from 'react'
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
  const startingPageY = useRef(0)
  const [lockedX, setLockedX] = useState<number | undefined>(undefined)
  const [yPos, setyPos] = useState<number | undefined>(0)
  const [isResizing, setIsResizing] = useState(false)
  const lockedSnapPoint = useRef(currentSnapPoint)
  const wrapperRef = createRef<HTMLDivElement>()
  const height = useRef(0)

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
      const newDiffY = e.clientY - startingPageY.current

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

      if (newDiffY !== 0) {
        setyPos(newDiffY)
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsResizing(false)
        setLockedX(undefined)
        setyPos(undefined)
        setIsExpanding(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [setIsResizing, setLockedX, setyPos, setIsExpanding])

  useEffect(() => {
    const handleMouseUp = () => {
      if (isResizing) {
        setIsExpanding(false)
        onResize(lockedSnapPoint.current)
        onRelease()
        setLockedX(undefined)
        setyPos(undefined)
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
    startingPageY.current = e.clientY
    setIsResizing(true)
    onGrab()
  }

  const lockedStyle: CSSProperties = lockedX
    ? {
        right: Math.min(-lockedX, 0),
        width: Math.abs(lockedX)
      }
    : {}
  if (yPos) {
    lockedStyle.bottom = Math.max(yPos, 0)
    lockedStyle.height = height.current + yPos
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={className}
      onMouseDown={handleMouseDown}
      data-testid="vertical-plot-resizer"
      ref={node => (height.current = node?.getBoundingClientRect().height || 0)}
    >
      {isResizing && (
        <div className={styles.resizerLocked} style={lockedStyle} />
      )}
    </div>
  )
}
