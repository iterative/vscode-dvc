import React, { CSSProperties, useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { ComparisonPlot } from 'dvc/src/plots/webview/contract'
import { ComparisonTableCell } from './ComparisonTableCell'
import styles from '../styles.module.scss'
import { changeDisabledDragIds } from '../comparisonTableSlice'

export const ComparisonTableMultiCell: React.FC<{
  path: string
  plot: ComparisonPlot
  imgHeight: number
}> = ({ path, plot, imgHeight }) => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const dispatch = useDispatch()

  const addDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([path]))
  }, [dispatch, path])

  const removeDisabled = useCallback(() => {
    dispatch(changeDisabledDragIds([]))
  }, [dispatch])

  return (
    <div
      data-testid="multi-image-cell"
      style={{ '--img-height': `${imgHeight}px` } as CSSProperties}
      className={styles.multiImageWrapper}
    >
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
            setCurrentStep(Number(event.target.value))
          }}
        />
        <p>{currentStep}</p>
      </div>
    </div>
  )
}
