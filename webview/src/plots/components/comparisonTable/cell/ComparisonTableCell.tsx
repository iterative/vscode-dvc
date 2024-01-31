import React from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import {
  ComparisonClassDetails,
  ComparisonPlotClasses,
  ComparisonPlot
} from 'dvc/src/plots/webview/contract'
import { ComparisonTableLoadingCell } from './ComparisonTableLoadingCell'
import { ComparisonTableMissingCell } from './ComparisonTableMissingCell'
import { ComparisonTableBoundingBoxImg } from './ComparisonTableBoundingBoxImg'
import styles from '../styles.module.scss'
import { zoomPlot } from '../../../util/messages'
import { PlotsState } from '../../../store'

const selectPlotClasses = (state: PlotsState) => state.comparison.plotClasses
const selectClasses = createSelector(
  [selectPlotClasses, (_, id: string) => id, (_, id, path: string) => path],
  (plotClasses: ComparisonPlotClasses, id: string, path: string) =>
    plotClasses[id]?.[path]
)

export const ComparisonTableCell: React.FC<{
  path: string
  plot: ComparisonPlot
  classDetails: ComparisonClassDetails
  imgAlt?: string
}> = ({ path, plot, imgAlt, classDetails }) => {
  const plotImg = plot.imgs[0]
  const classes = useSelector((state: PlotsState) =>
    selectClasses(state, plot.id, path)
  )

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
