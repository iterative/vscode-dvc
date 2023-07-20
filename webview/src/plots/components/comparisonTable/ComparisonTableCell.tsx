import React, { useState } from 'react'
import cx from 'classnames'
import {
  ComparisonPlot,
  ComparisonPlotImg
} from 'dvc/src/plots/webview/contract'
import styles from './styles.module.scss'
import { RefreshButton } from '../../../shared/components/button/RefreshButton'
import { refreshRevisions, zoomPlot } from '../../util/messages'
import { ErrorIcon } from '../../../shared/components/errorIcon/ErrorIcon'

const MissingPlotTableCell: React.FC<{ plot: ComparisonPlotImg }> = ({
  plot
}) => (
  <div className={styles.noImageContent}>
    {plot.errors?.length ? (
      <>
        <div className={styles.errorIcon}>
          <ErrorIcon error={plot.errors.join('\n')} size={48} />
        </div>
        <RefreshButton onClick={refreshRevisions} />
      </>
    ) : (
      <p className={styles.emptyIcon}>-</p>
    )}
  </div>
)

export const ComparisonTableCellSingle: React.FC<{
  path: string
  plot: ComparisonPlot
}> = ({ path, plot }) => {
  const plotImg = plot.imgOrImgs[0]
  const loading = plotImg.loading
  const missing = !loading && !plotImg.url

  if (loading) {
    return (
      <div className={styles.noImageContent}>
        <p>Loading...</p>
      </div>
    )
  }

  if (missing) {
    return <MissingPlotTableCell plot={plotImg} />
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
        alt={`Plot of ${path} (${plot.id})`}
      />
    </button>
  )
}

export const ComparisonTableCellMulti: React.FC<{
  path: string
  plot: ComparisonPlot
}> = ({ path, plot }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const { loading, url, id } = plot.imgOrImgs[currentStep]
  const missing = !loading && !url

  if (loading) {
    return (
      <div className={styles.noImageContent}>
        <p>Loading...</p>
      </div>
    )
  }

  if (missing) {
    return <MissingPlotTableCell plot={plot.imgOrImgs[currentStep]} />
  }

  return (
    <button
      className={cx(styles.imageWrapper, styles.multiImageWrapper)}
      onClick={() => zoomPlot(url)}
      data-testid="image-plot-button"
    >
      <img
        className={styles.image}
        draggable={false}
        src={url}
        alt={`I am indeed number ${currentStep} Plot of ${path} (${id})`}
      />
      <div className={styles.multiImageSlider}>
        <label htmlFor={`${id}-step`}>Step</label>
        <input
          name={`${id}-step`}
          min="0"
          max={plot.imgOrImgs.length - 1}
          value={currentStep}
          type="range"
          onChange={event => {
            setCurrentStep(Number(event.target.value))
          }}
        />
        <p>{currentStep}</p>
      </div>
    </button>
  )
}
