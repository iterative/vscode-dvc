import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import { ComparisonTableCell } from './ComparisonTableCell'
import styles from '../styles.module.scss'
import { changeDisabledDragIds } from '../comparisonTableSlice'

export const ComparisonTableMultiCell: React.FC<{
  path: string
  plot: ComparisonPlot
}> = ({ path, plot }) => {
  const [step, setStep] = useState<number>(0)
  const currentStep = step
  const dispatch = useDispatch()

  const addDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([path]))
  }, [dispatch, path])

  const removeDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([]))
  }, [dispatch])

  useEffect(() => {
    const maxStep = plot.imgs.length - 1
    if (step > maxStep) {
      setStep(maxStep)
    }
  }, [plot.imgs.length, step])

  return (
    <div data-testid="multi-image-cell" className={styles.multiImageWrapper}>
      <ComparisonTableCell
        path={path}
        plot={{
          id: plot.id,
          imgs: [
            plot.imgs[currentStep] || {
              errors: undefined,
              loading: false,
              url: undefined
            }
          ]
        }}
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
            setStep(Number(event.target.value))
          }}
        />
        <p>{currentStep}</p>
      </div>
    </div>
  )
}
