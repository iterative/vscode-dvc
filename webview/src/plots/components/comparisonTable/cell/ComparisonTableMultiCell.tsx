import React, { useEffect, useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  ComparisonClassDetails,
  ComparisonPlot,
  ComparisonPlotImg
} from 'dvc/src/plots/webview/contract'
import { ComparisonTableCell } from './ComparisonTableCell'
import styles from '../styles.module.scss'
import { changeDisabledDragIds } from '../comparisonTableSlice'
import { setComparisonMultiPlotValue } from '../../../util/messages'
import { PlotsState } from '../../../store'

export const ComparisonTableMultiCell: React.FC<{
  path: string
  plot: ComparisonPlot
  classDetails: ComparisonClassDetails
}> = ({ path, plot, classDetails }) => {
  const values = useSelector(
    (state: PlotsState) => state.comparison.multiPlotValues
  )
  const [currentStep, setCurrentStep] = useState(values?.[plot.id]?.[path] || 0)
  const dispatch = useDispatch()
  const maxStep = plot.imgs.length - 1
  const changeDebounceTimer = useRef(0)
  const selectedImg: ComparisonPlotImg = plot.imgs[currentStep] || {
    errors: undefined,
    ind: currentStep,
    loading: false,
    url: undefined
  }

  const addDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([path]))
  }, [dispatch, path])

  const removeDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([]))
  }, [dispatch])

  useEffect(() => {
    window.clearTimeout(changeDebounceTimer.current)
    changeDebounceTimer.current = window.setTimeout(() => {
      const isOnMount =
        values?.[plot.id]?.[path] === undefined && currentStep === 0
      const stepMatchesState = currentStep === values?.[plot.id]?.[path]
      if (isOnMount || stepMatchesState) {
        return
      }
      setComparisonMultiPlotValue(path, plot.id, currentStep)
    }, 500)
  }, [values, path, plot.id, currentStep])

  return (
    <div data-testid="multi-image-cell" className={styles.multiImageWrapper}>
      <ComparisonTableCell
        path={path}
        plot={{
          id: plot.id,
          imgs: [selectedImg]
        }}
        imgAlt={`${selectedImg.ind} of ${path} (${plot.id})`}
        classDetails={classDetails}
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
          value={currentStep}
          onChange={event => {
            if (!event.target) {
              return
            }

            setCurrentStep(Number(event.target.value))
          }}
        />
        <p>{selectedImg.ind}</p>
      </div>
    </div>
  )
}
