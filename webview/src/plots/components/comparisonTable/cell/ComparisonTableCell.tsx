import React from 'react'
import {
  ComparisonClassDetails,
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
  classDetails: ComparisonClassDetails
  imgAlt?: string
}> = ({ path, plot, imgAlt, classDetails }) => {
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
      onClick={() => zoomPlot(plotImg.url)}
      data-testid="image-plot-button"
    >
      {plotImg.url && Object.keys(classDetails).length > 0 ? (
        <ComparisonTableBoundingBoxImg
          src={plotImg.url}
          id={plot.id}
          path={path}
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
