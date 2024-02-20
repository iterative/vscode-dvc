import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import {
  ComparisonClassDetails,
  ComparisonPlotClasses
} from 'dvc/src/plots/webview/contract'
import { ComparisonTableBoundingBoxColorFilter } from './ComparisonTableBoundingBoxColorFilter'
import styles from '../styles.module.scss'
import { PlotsState } from '../../../store'
import { getIdFromTextAndColor } from '../../../../util/ids'

const plotClassesSelector = (state: PlotsState) => state.comparison.plotClasses
const classesSelector = createSelector(
  [
    plotClassesSelector,
    (_, id: string) => id,
    (_, id, path: string) => path,
    (_, id, path, ind: number) => ind
  ],
  (plotClasses: ComparisonPlotClasses, id: string, path: string, ind: number) =>
    plotClasses[id]?.[path]?.[ind] || []
)

export const ComparisonTableBoundingBoxImg: React.FC<{
  id: string
  src: string
  path: string
  classDetails: ComparisonClassDetails
  alt: string
  ind?: number
}> = ({ alt, classDetails, id, src, path, ind = 0 }) => {
  const classes = useSelector((state: PlotsState) =>
    classesSelector(state, id, path, ind)
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

        return boxes.map(({ box: { bottom, top, right, left }, score }) => (
          <React.Fragment key={label + top + right + left + bottom}>
            <text
              filter={`url(#${getIdFromTextAndColor(alt, labelColor)})`}
              x={left - 1}
              y={top - 4}
              fill="#fff"
              className={styles.imageBoundingBoxText}
            >
              {label} {score}
            </text>
            <rect
              width={right - left}
              height={bottom - top}
              x={left}
              y={top}
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
