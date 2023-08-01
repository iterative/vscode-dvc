import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import { ComparisonTableCell } from './ComparisonTableCell'
import styles from '../styles.module.scss'
import {
  changeDisabledDragIds,
  setMultiPlotValue
} from '../comparisonTableSlice'
import { PlotsState } from '../../../store'

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

  const addDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([path]))
  }, [dispatch, path])

  const removeDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([]))
  }, [dispatch])

  return (
    <div data-testid="multi-image-cell" className={styles.multiImageWrapper}>
      <ComparisonTableCell
        path={path}
        plot={{ id: plot.id, imgs: [plot.imgs[currentStep]] }}
        imgAlt={`${currentStep} of ${path} (${plot.id})`}
      />
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
