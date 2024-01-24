import React, { useEffect, useState } from 'react'
import {
  ComparisonBoundingBoxClasses,
  ComparisonPlotBoundingBoxes
} from 'dvc/src/plots/webview/contract'
import { ComparisonTableBoundingBoxColorFilter } from './ComparisonTableBoundingBoxColorFilter'
import styles from '../styles.module.scss'

export const ComparisonTableBoundingBoxImg: React.FC<{
  src: string
  boxCoords: ComparisonPlotBoundingBoxes
  classes: ComparisonBoundingBoxClasses
  alt: string
}> = ({ alt, src, boxCoords, classes }) => {
  const [naturalWidth, setNaturalWidth] = useState(0)
  const [naturalHeight, setNaturalHeight] = useState(0)

  useEffect(() => {
    const img = new Image()
    img.src = src

    img.addEventListener('load', () => {
      setNaturalWidth(img.naturalWidth)
      setNaturalHeight(img.naturalHeight)
    })
  }, [src])

  return (
    <svg
      className={styles.image}
      viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
      aria-label={alt}
      role="img"
    >
      {Object.entries(classes).map(
        ([label, { color, selected }]) =>
          selected && (
            <ComparisonTableBoundingBoxColorFilter key={label} color={color} />
          )
      )}
      <image href={src} width={naturalWidth} height={naturalHeight} />
      {boxCoords.map(({ label, boxes }) => {
        const labelColor = classes[label].color
        return boxes.map(({ h, w, x, y }) => (
          <React.Fragment key={label + h + w + x + y}>
            <text
              filter={`url(#c${labelColor.slice(1)})`}
              x={x - 1}
              y={y - 4}
              fill="#fff"
              className={styles.imageBoundingBoxText}
            >
              {label}
            </text>
            <rect
              width={w}
              height={h}
              x={x}
              y={y}
              fill="transparent"
              strokeWidth="3px"
              stroke={labelColor}
            />
          </React.Fragment>
        ))
      })}
    </svg>
  )
}
