import React, { ChangeEvent, useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import { ComparisonTableCell } from './ComparisonTableCell'
import styles from '../styles.module.scss'
import { changeDisabledDragIds } from '../comparisonTableSlice'
import { setComparisonMultiPlotValue } from '../../../util/messages'
import { PlotsState } from '../../../store'

export const ComparisonTableMultiCell: React.FC<{
  path: string
  plot: ComparisonPlot
}> = ({ path, plot }) => {
  const values = useSelector(
    (state: PlotsState) => state.comparison.multiPlotValues
  )
  const currentStep = values?.[path]?.[plot.id] || 0
  const dispatch = useDispatch()

  const addDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([path]))
  }, [dispatch, path])

  const removeDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([]))
  }, [dispatch])

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    // I think we need to lower the amount of calls being made
    setComparisonMultiPlotValue(path, plot.id, Number(event.target.value))
  }

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
          onChange={handleSliderChange}
        />
        <p>{currentStep}</p>
      </div>
    </div>
  )
}
