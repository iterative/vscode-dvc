import React, { ChangeEvent, useCallback, useRef } from 'react'
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
  const imageStep = values?.[plot.id]?.[path] || 0
  const dispatch = useDispatch()
  const maxStep = plot.imgs.length - 1
  const changeDebounceTimer = useRef(0)

  const addDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([path]))
  }, [dispatch, path])

  const removeDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([]))
  }, [dispatch])

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target) {
      return
    }
    window.clearTimeout(changeDebounceTimer.current)
    changeDebounceTimer.current = window.setTimeout(() => {
      setComparisonMultiPlotValue(path, plot.id, Number(event.target.value))
    }, 500)
  }

  return (
    <div data-testid="multi-image-cell" className={styles.multiImageWrapper}>
      <ComparisonTableCell
        path={path}
        plot={{
          id: plot.id,
          imgs: [
            plot.imgs[imageStep] || {
              errors: undefined,
              loading: false,
              url: undefined
            }
          ]
        }}
        imgAlt={`${imageStep} of ${path} (${plot.id})`}
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
          max={maxStep}
          type="range"
          onChange={handleSliderChange}
        />
        <p>{imageStep}</p>
      </div>
    </div>
  )
}
