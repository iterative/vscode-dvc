import React from 'react'
import {
  ComparisonBoundingBoxLabels,
  ComparisonPlot
} from 'dvc/src/plots/webview/contract'
import { ComparisonTableLoadingCell } from './ComparisonTableLoadingCell'
import { ComparisonTableMissingCell } from './ComparisonTableMissingCell'
import { ComparisonTableBoundingBoxImg } from './ComparisonTableBoundingBoxImg'
import styles from '../styles.module.scss'
import { zoomPlot } from '../../../util/messages'

export const ComparisonTableCell: React.FC<{
  path: string
  plot: ComparisonPlot
  imgAlt?: string
  boundingBoxLabels: ComparisonBoundingBoxLabels
}> = ({ path, plot, imgAlt, boundingBoxLabels }) => {
  const plotImg = plot.imgs[0]

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
      onClick={() => zoomPlot(plotImg.url)} // zoomed in plot will need to be updated if we want it to include bounding boxes
      data-testid="image-plot-button"
    >
      {plotImg.url && plotImg.boundingBoxes ? (
        <ComparisonTableBoundingBoxImg
          src={plotImg.url}
          boxCoords={plotImg.boundingBoxes}
          labels={boundingBoxLabels}
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
