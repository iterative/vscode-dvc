import React, { useCallback, MouseEvent, KeyboardEvent } from 'react'
import cx from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import {
  ComparisonPlot,
  ComparisonPlotImg
} from 'dvc/src/plots/webview/contract'
import {
  changeDisabledDragIds,
  setMultiPlotValue
} from './comparisonTableSlice'
import styles from './styles.module.scss'
import { RefreshButton } from '../../../shared/components/button/RefreshButton'
import { refreshRevisions, zoomPlot } from '../../util/messages'
import { ErrorIcon } from '../../../shared/components/errorIcon/ErrorIcon'
import { PlotsState } from '../../store'

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
  const multiValues = useSelector(
    (state: PlotsState) => state.comparison.multiPlotValues
  )
  const dispatch = useDispatch()
  const currentStep = multiValues[path] || 0
  const { loading, url, id } = plot.imgOrImgs[currentStep]
  const missing = !loading && !url

  const addDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([path]))
  }, [dispatch, path])

  const removeDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([]))
  }, [dispatch])

  const disableClick = useCallback((e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation()
  }, [])

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
        alt={`${currentStep} of ${path} (${id})`}
      />
      {/* The div element have children that allow keyboard interaction */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className={styles.multiImageSlider}
        onMouseEnter={addDisabled}
        onMouseLeave={removeDisabled}
        onClick={disableClick}
        onKeyDown={disableClick}
      >
        <label htmlFor={`${id}-step`}>Step</label>
        <input
          name={`${id}-step`}
          min="0"
          max={plot.imgOrImgs.length - 1}
          value={currentStep}
          type="range"
          onChange={event => {
            dispatch(
              setMultiPlotValue({ path, value: Number(event.target.value) })
            )
          }}
        />
        <p>{currentStep}</p>
      </div>
    </button>
  )
}
