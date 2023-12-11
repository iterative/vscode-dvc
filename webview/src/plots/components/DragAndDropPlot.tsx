import cx from 'classnames'
import React, { HTMLAttributes, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import styles from './styles.module.scss'
import { changeDragAndDropMode } from './util'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'
import { Icon } from '../../shared/components/Icon'
import { GraphLine } from '../../shared/components/icons'
import { withScale } from '../../util/styles'
import { useDragAndDrop } from '../../shared/hooks/useDragAndDrop'
import { DropTarget } from './DropTarget'
import { useGetTitles } from '../hooks/useGetTitles'
import { DragDropItemWithTarget } from '../../shared/components/dragDrop/DragDropItemWithTarget'

interface DragAndDropPlotProps extends HTMLAttributes<HTMLDivElement> {
  plot: string
  group: string
  sectionKey: PlotsSection
  colSpan: number
  isParentDraggedOver?: boolean
  setOrder: (order: string[]) => void
  order: string[]
}

export const DragAndDropPlot: React.FC<DragAndDropPlotProps> = ({
  plot,
  sectionKey,
  colSpan,
  group,
  isParentDraggedOver,
  setOrder,
  order,
  ...props
}) => {
  const dispatch = useDispatch()
  const dragAndDropTimeout = useRef(0)
  const titles = useGetTitles(sectionKey, plot)
  const title = titles?.title || ''
  const subtitle = titles?.subtitle || ''

  const handleDragEnd = () => {
    changeDragAndDropMode(sectionKey, dispatch, true)
  }

  const { isAfter, target, ...dragAndDropProps } = useDragAndDrop({
    id: plot,
    onDragEnd: handleDragEnd,
    order,
    setOrder,
    group,
    dropTarget: <DropTarget />,
    isParentDraggedOver,
    style: withScale(colSpan)
  })

  useEffect(() => {
    return () => {
      clearTimeout(dragAndDropTimeout.current)
    }
  }, [])

  const handleEndOfDragAndDrop = () => {
    // This makes sure every onDrop and onDragEnd events have been called before switching to normal mode
    dragAndDropTimeout.current = window.setTimeout(() => {
      changeDragAndDropMode(sectionKey, dispatch, true)
    }, 100)
  }

  return (
    <DragDropItemWithTarget
      isAfter={isAfter}
      dropTarget={target || null}
      draggable={<div />}
    >
      <div {...props} {...dragAndDropProps}>
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
      </div>
    </DragDropItemWithTarget>
  )
}
