import React from 'react'
import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import { ComparisonTableLoadingCell } from './ComparisonTableLoadingCell'
import { ComparisonTableMissingCell } from './ComparisonTableMissingCell'
import styles from '../styles.module.scss'
import { zoomPlot } from '../../../util/messages'

export const ComparisonTableCell: React.FC<{
  path: string
  plot: ComparisonPlot
  imgAlt?: string
}> = ({ path, plot, imgAlt }) => {
  const plotImg = plot.imgs[0]

  const loading = plotImg.loading
  const missing = !loading && !plotImg.url

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
      <img
        className={styles.image}
        draggable={false}
        src={plotImg.url}
        alt={imgAlt || `Plot of ${path} (${plot.id})`}
      />
    </button>
  )
}
