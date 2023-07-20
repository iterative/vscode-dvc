import React, { useState } from 'react'
import cx from 'classnames'
import {
  ComparisonPlotImg,
  ComparisonPlotMulti,
  ComparisonPlotSingle
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
  plot: ComparisonPlotSingle
}> = ({ path, plot }) => {
  const loading = plot.loading
  const missing = !loading && !plot.url

  if (loading) {
    return (
      <div className={styles.noImageContent}>
        <p>Loading...</p>
      </div>
    )
  }

  if (missing) {
    return <MissingPlotTableCell plot={plot} />
  }

  return (
    <button
      className={styles.imageWrapper}
      onClick={() => zoomPlot(plot.url)}
      data-testid="image-plot-button"
    >
      <img
        className={styles.image}
        draggable={false}
        src={plot.url}
        alt={`Plot of ${path} (${plot.id})`}
      />
    </button>
  )
}

export const ComparisonTableCellMulti: React.FC<{
  path: string
  plot: ComparisonPlotMulti
}> = ({ path, plot }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const { loading, url, id } = plot.imgs[currentStep]
  const missing = !loading && !url

  if (loading) {
    return (
      <div className={styles.noImageContent}>
        <p>Loading...</p>
      </div>
    )
  }

  if (missing) {
    return <MissingPlotTableCell plot={plot.imgs[currentStep]} />
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
          max={plot.imgs.length - 1}
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
