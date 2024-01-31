import React from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import {
  ComparisonClassDetails,
  ComparisonPlotClasses,
  ComparisonPlot,
  ComparisonPlotClass
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
  classDetails: ComparisonClassDetails
  imgAlt?: string
}> = ({ path, plot, imgAlt, classDetails }) => {
  const plotImg = plot.imgs[0]

  const plotClasses = useSelector(
    (state: PlotsState) => state.comparison.plotClasses
  )
  const getCellClasses = createSelector(
    (classes: ComparisonPlotClasses) => classes[plot.id],
    (classesByPath: { [path: string]: ComparisonPlotClass[] } | undefined) =>
      classesByPath?.[path]
  )
  const classes: ComparisonPlotClass[] | undefined = getCellClasses(plotClasses)

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
      {plotImg.url && classes ? (
        <ComparisonTableBoundingBoxImg
          src={plotImg.url}
          classes={classes}
          classDetails={classDetails}
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
