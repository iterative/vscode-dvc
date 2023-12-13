import cx from 'classnames'
import React, {
  DragEvent,
  HTMLAttributes,
  createRef,
  useEffect,
  useRef
} from 'react'
import { useDispatch } from 'react-redux'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import styles from './styles.module.scss'
import { changeDragAndDropMode } from './util'
import { DropTarget } from './DropTarget'
import { GripIcon } from '../../shared/components/dragDrop/GripIcon'
import { Icon } from '../../shared/components/Icon'
import { GraphLine } from '../../shared/components/icons'
import { withScale } from '../../util/styles'
import { OnDrop, useDragAndDrop } from '../../shared/hooks/useDragAndDrop'
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
  isLast?: boolean
  afterOnDrop?: OnDrop
}

export const DragAndDropPlot: React.FC<DragAndDropPlotProps> = ({
  plot,
  sectionKey,
  colSpan,
  group,
  isParentDraggedOver,
  setOrder,
  order,
  isLast,
  afterOnDrop,
  ...props
}) => {
  const dispatch = useDispatch()
  const dragAndDropTimeout = useRef(0)
  const ref = createRef<HTMLDivElement>()
  const titles = useGetTitles(sectionKey, plot)
  const title = titles?.title || ''
  const subtitle = titles?.subtitle || ''

  const handleDragEnd = () => changeDragAndDropMode(sectionKey, dispatch, true)

  const { isAfter, target, onDragStart, ...dragAndDropProps } = useDragAndDrop({
    dropTarget: <DropTarget />,
    group,
    id: plot,
    isLast,
    isParentDraggedOver,
    onDragEnd: handleDragEnd,
    onDrop: afterOnDrop,
    order,
    setOrder,
    style: withScale(colSpan)
  })

  useEffect(() => {
    return () => {
      clearTimeout(dragAndDropTimeout.current)
    }
  }, [])

  const handleDragStart = (e: DragEvent<HTMLElement>) => {
    onDragStart(e)
    // Because the dragged element is being created while being dragged for plots in grids, there is a problem where
    // the dragend event is not being associated with the element. Re-adding the event makes sure it's being called.
    ref.current?.addEventListener('dragend', dragAndDropProps.onDragEnd)
  }

  const handleEndOfDragAndDrop = () => {
    // This makes sure every onDrop and onDragEnd events have been called before switching to normal mode
    dragAndDropTimeout.current = window.setTimeout(() => {
      handleDragEnd()
    }, 100)
  }

  return (
    <DragDropItemWithTarget
      isAfter={isAfter}
      dropTarget={target || null}
      draggable={<div />}
    >
      <div
        {...props}
        {...dragAndDropProps}
        onDragStart={handleDragStart}
        ref={ref}
      >
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
