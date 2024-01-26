import React from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import {
  ComparisonBoundingBoxClasses,
  ComparisonBoundingBoxPlotCoords,
  ComparisonPlot,
  ComparisonPlotBoundingBox
} from 'dvc/src/plots/webview/contract'
import { ComparisonTableLoadingCell } from './ComparisonTableLoadingCell'
import { ComparisonTableMissingCell } from './ComparisonTableMissingCell'
import { ComparisonTableBoundingBoxImg } from './ComparisonTableBoundingBoxImg'
import styles from '../styles.module.scss'
import { zoomPlot } from '../../../util/messages'
import { PlotsState } from '../../../store'

export const ComparisonTableCell: React.FC<{
  path: string
  plot: ComparisonPlot
  boundingBoxClasses: ComparisonBoundingBoxClasses
  imgAlt?: string
}> = ({ path, plot, imgAlt, boundingBoxClasses }) => {
  const plotImg = plot.imgs[0]

  const boundingBoxCoords = useSelector(
    (state: PlotsState) => state.comparison.boundingBoxPlotCoords
  )
  const getCellBoundingBoxCoords = createSelector(
    (bbPlotCoords: ComparisonBoundingBoxPlotCoords) => bbPlotCoords[plot.id],
    (bbCoords: { [path: string]: ComparisonPlotBoundingBox[] } | undefined) =>
      bbCoords?.[path]
  )
  const cellBoundingBoxCoords: ComparisonPlotBoundingBox[] | undefined =
    getCellBoundingBoxCoords(boundingBoxCoords)

  const loading = plotImg.loading
  const missing = !loading && !plotImg.url
  const alt = imgAlt || `Plot of ${path} (${plot.id})`

  if (loading) {
    return <ComparisonTableLoadingCell />
  }

  if (missing) {
    return <ComparisonTableMissingCell plot={plotImg} />
  }

  return (
    <button
      className={styles.imageWrapper}
      onClick={() => zoomPlot(plotImg.url)}
      data-testid="image-plot-button"
    >
      {plotImg.url && cellBoundingBoxCoords ? (
        <ComparisonTableBoundingBoxImg
          src={plotImg.url}
          boxCoords={cellBoundingBoxCoords}
          classes={boundingBoxClasses}
          alt={alt}
        />
      ) : (
        <img
          className={styles.image}
          draggable={false}
          src={plotImg.url}
          alt={alt}
        />
      )}
    </button>
  )
}
