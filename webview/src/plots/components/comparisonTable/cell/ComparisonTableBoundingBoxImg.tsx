import React, { useEffect, useState } from 'react'
import cx from 'classnames'
import {
  ComparisonBoundingBoxLabels,
  ComparisonPlotBoundingBoxes
} from 'dvc/src/plots/webview/contract'
import { BoundingBoxColorFilter } from './BoundingBoxColorFilter'
import styles from '../styles.module.scss'

export const ComparisonTableBoundingBoxImg: React.FC<{
  src: string
  boxCoords: ComparisonPlotBoundingBoxes
  labels: ComparisonBoundingBoxLabels
  alt: string
}> = ({ alt, src, boxCoords, labels = {} }) => {
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
      className={cx(styles.image, styles.boundingBoxImg)}
      viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
      aria-label={alt}
    >
      {Object.entries(labels).map(([label, { color }]) => (
        <BoundingBoxColorFilter key={label} color={color} />
      ))}
      <image href={src} width={naturalWidth} height={naturalHeight} />
      {boxCoords.map(({ label, boxes }) => {
        return boxes.map(({ h, w, x, y }) => (
          <React.Fragment key={label + h + w + x + y}>
            <text
              filter={`url(#c${labels[label].color.slice(1)})`}
              x={x - 1}
              y={y - 4}
              fill="#fff"
            >
              {label}
            </text>
            <rect
              width={w}
              height={h}
              x={x}
              y={y}
              style={{
                fill: 'transparent',
                stroke: labels[label].color, // only the stroke needs to be here
                strokeWidth: '3px'
              }}
            />
          </React.Fragment>
        ))
      })}
    </svg>
  )
}
