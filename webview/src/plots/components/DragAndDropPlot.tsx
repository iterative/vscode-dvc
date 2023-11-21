import cx from 'classnames'
import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import {
  DVC_METRIC_TITLE,
  DVC_METRIC_X_LABEL,
  DVC_METRIC_Y_LABEL
} from 'dvc/src/cli/dvc/contract'
import styles from './styles.module.scss'
import { changeDragAndDropMode, getMetricVsParamTitle } from './util'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'
import { Icon } from '../../shared/components/Icon'
import { GraphLine } from '../../shared/components/icons'
import { useGetPlot } from '../hooks/useGetPlot'

interface DragAndDropPlotProps {
  plot: string
  sectionKey: PlotsSection
}

export const DragAndDropPlot: React.FC<DragAndDropPlotProps> = ({
  plot,
  sectionKey
}) => {
  const dispatch = useDispatch()
  const dragAndDropTimeout = useRef(0)
  const [, titles] = useGetPlot(sectionKey, plot)

  useEffect(() => {
    return () => {
      clearTimeout(dragAndDropTimeout.current)
    }
  }, [])

  let title = titles?.[DVC_METRIC_TITLE]
  let subtitle = ''

  // ONLY FOR CUSTOM PLOTS
  const yTitle = titles?.[DVC_METRIC_Y_LABEL] as string
  const xTitle = titles?.[DVC_METRIC_X_LABEL] as string

  title = getMetricVsParamTitle(yTitle, xTitle)
  subtitle = plot.replace('custom-', '')

  const handleEndOfDragAndDrop = () => {
    // This makes sure every onDrop and onDragEnd events have been called before switching to normal mode
    dragAndDropTimeout.current = window.setTimeout(() => {
      changeDragAndDropMode(sectionKey, dispatch, true)
    }, 100)
  }

  return (
    <>
      {
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div onMouseUp={handleEndOfDragAndDrop}>
          <GripIcon className={styles.plotGripIcon} />
        </div>
      }
      <div className={styles.dragAndDropPlotContent}>
        <h2 className={styles.dragAndDropPlotTitle}>{title}</h2>
        {subtitle && (
          <h3 className={styles.dragAndDropPlotSubtitle}>{subtitle}</h3>
        )}
        <Icon
          icon={GraphLine}
          className={cx(styles.dropIcon, styles.onPlotDropIcon)}
          width={70}
          height={70}
        />
      </div>
    </>
  )
}
