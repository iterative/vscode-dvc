import React, { useCallback } from 'react'
import cx from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import { ComparisonTableLoadingCell } from './ComparisonTableLoadingCell'
import { ComparisonTableMissingCell } from './ComparisonTableMissingCell'
import styles from '../styles.module.scss'
import {
  changeDisabledDragIds,
  setMultiPlotValue
} from '../comparisonTableSlice'
import { PlotsState } from '../../../store'
import { zoomPlot } from '../../../util/messages'

const getCurrentStep = (stateStep: number | undefined, imgsLength: number) => {
  if (!stateStep) {
    return 0
  }
  return stateStep > imgsLength - 1 ? imgsLength - 1 : stateStep
}

export const ComparisonTableMultiCell: React.FC<{
  path: string
  plot: ComparisonPlot
}> = ({ path, plot }) => {
  const multiValues = useSelector(
    (state: PlotsState) => state.comparison.multiPlotValues
  )
  const dispatch = useDispatch()
  const currentStep = getCurrentStep(multiValues[path], plot.imgs.length)

  const { loading, url } = plot.imgs[currentStep]
  const missing = !loading && !url

  const addDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([path]))
  }, [dispatch, path])

  const removeDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([]))
  }, [dispatch])

  let imageContent = (
    <button
      className={cx(styles.imageWrapper, styles.multiImageWrapper)}
      onClick={() => zoomPlot(url)}
      data-testid="image-plot-button"
    >
      <img
        className={styles.image}
        draggable={false}
        src={url}
        alt={`${currentStep} of ${path} (${plot.id})`}
      />
    </button>
  )

  if (loading) {
    imageContent = <ComparisonTableLoadingCell />
  }

  if (missing) {
    imageContent = <ComparisonTableMissingCell plot={plot.imgs[currentStep]} />
  }

  return (
    <div data-testid="multi-image-cell" className={styles.multiImageWrapper}>
      {imageContent}
      <div
        className={styles.multiImageSlider}
        onMouseEnter={addDisabled}
        onMouseLeave={removeDisabled}
      >
        <label htmlFor={`${plot.id}-step`}>Step</label>
        <input
          name={`${plot.id}-step`}
          min="0"
          max={plot.imgs.length - 1}
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
    </div>
  )
}
