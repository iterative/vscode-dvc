import React, { useCallback, MouseEvent, KeyboardEvent } from 'react'
import cx from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import {
  changeDisabledDragIds,
  setMultiPlotValue
} from '../comparisonTableSlice'
import { PlotsState } from '../../../store'
import styles from '../styles.module.scss'
import { ComparisonTableLoadingCell } from './ComparisonTableLoadingCell'
import { ComparisonTableMissingCell } from './ComparisonTableMissingCell'
import { zoomPlot } from '../../../util/messages'

export const ComparisonTableMultiCell: React.FC<{
  path: string
  plot: ComparisonPlot
}> = ({ path, plot }) => {
  const multiValues = useSelector(
    (state: PlotsState) => state.comparison.multiPlotValues
  )
  const dispatch = useDispatch()
  const currentStep = multiValues[path] || 0

  const { loading, url } = plot.imgOrImgs[currentStep]
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

  const slider = (
    // The div element has children that allow keyboard interaction
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={styles.multiImageSlider}
      onMouseEnter={addDisabled}
      onMouseLeave={removeDisabled}
      onClick={disableClick}
      onKeyDown={disableClick}
    >
      <label htmlFor={`${plot.id}-step`}>Step</label>
      <input
        name={`${plot.id}-step`}
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
  )

  if (loading) {
    return (
      <div className={styles.multiImageWrapper}>
        <ComparisonTableLoadingCell />
        {slider}
      </div>
    )
  }

  if (missing) {
    return (
      <div className={styles.multiImageWrapper}>
        <ComparisonTableMissingCell plot={plot.imgOrImgs[currentStep]} />
        {slider}
      </div>
    )
  }

  return (
    <button
      className={cx(styles.imageWrapper, styles.multiImageWrapper)}
      onClick={() => url && zoomPlot(url)}
      data-testid="image-plot-button"
    >
      <img
        className={styles.image}
        draggable={false}
        src={url}
        alt={`${currentStep} of ${path} (${plot.id})`}
      />
      {slider}
    </button>
  )
}
