import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import {
  ComparisonClassDetails,
  ComparisonPlotClasses
} from 'dvc/src/plots/webview/contract'
import {
  ComparisonTableBoundingBoxColorFilter,
  getColorFilterId
} from './ComparisonTableBoundingBoxColorFilter'
import styles from '../styles.module.scss'
import { PlotsState } from '../../../store'

const plotClassesSelector = (state: PlotsState) => state.comparison.plotClasses
const classesSelector = createSelector(
  [plotClassesSelector, (_, id: string) => id, (_, id, path: string) => path],
  (plotClasses: ComparisonPlotClasses, id: string, path: string) =>
    plotClasses[id]?.[path] || []
)

export const ComparisonTableBoundingBoxImg: React.FC<{
  id: string
  src: string
  path: string
  classDetails: ComparisonClassDetails
  alt: string
}> = ({ alt, classDetails, id, src, path }) => {
  const classes = useSelector((state: PlotsState) =>
    classesSelector(state, id, path)
  )
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
      {Object.entries(classDetails).map(
        ([label, { color, selected }]) =>
          selected && (
            <ComparisonTableBoundingBoxColorFilter
              imgAlt={alt}
              key={label}
              color={color}
            />
          )
      )}
      <image href={src} width={naturalWidth} height={naturalHeight} />
      {classes.map(({ label, boxes }) => {
        const labelColor = classDetails[label]?.color

        if (!labelColor) {
          return
        }

        return boxes.map(({ h, w, x, y }) => (
          <React.Fragment key={label + h + w + x + y}>
            <text
              filter={`url(#${getColorFilterId(alt, labelColor)})`}
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
