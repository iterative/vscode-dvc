import cx from 'classnames'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import React, { MouseEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { DropTarget } from './DropTarget'
import { changeDragAndDropMode } from '../util'
import { PlotsState } from '../../store'
import { useDragAndDrop } from '../../../shared/hooks/useDragAndDrop'
import { Pinned } from '../../../shared/components/icons'
import { GripIcon } from '../../../shared/components/dragDrop/GripIcon'
import { ThemeProperty, getThemeValue } from '../../../util/styles'
import { DragDropItemWithTarget } from '../../../shared/components/dragDrop/DragDropItemWithTarget'

export interface ComparisonTableHeaderProps {
  displayColor: string
  onClicked: () => void
  pinnedColumn?: string
  children?: React.ReactNode
  id: string
  order: string[]
  setOrder: (order: string[]) => void
}

export const ComparisonTableHeader: React.FC<ComparisonTableHeaderProps> = ({
  displayColor,
  children,
  onClicked,
  pinnedColumn,
  id,
  order,
  setOrder
}) => {
  const dispatch = useDispatch()
  const draggedId = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedRef?.itemId
  )
  const isInDragAndDropMode = useSelector(
    (state: PlotsState) => state.comparison.isInDragAndDropMode
  )
  const { isAfter, target, ...dragAndDropProps } = useDragAndDrop({
    disabledDropIds: pinnedColumn ? [pinnedColumn] : [],
    dropTarget: <DropTarget />,
    ghostElemStyle: {
      backgroundColor: getThemeValue(ThemeProperty.ACCENT_COLOR),
      color: getThemeValue(ThemeProperty.BACKGROUND_COLOR)
    },
    group: 'comparison',
    id,
    onDragEnd: () =>
      changeDragAndDropMode(PlotsSection.COMPARISON_TABLE, dispatch, true),
    order,
    setOrder,
    shouldShowOnDrag: true,
    type: <div />
  })
  const isPinned = id === pinnedColumn

  const pinClasses = cx(styles.pin, {
    [styles.pinned]: isPinned
  })

  const headerProps = isInDragAndDropMode ? dragAndDropProps : {}

  return (
    <th
      id={id}
      className={cx(styles.comparisonTableHeader, {
        [styles.pinnedColumnHeader]: isPinned,
        [styles.draggedColumn]: isInDragAndDropMode && draggedId === id
      })}
      onMouseDown={() =>
        changeDragAndDropMode(PlotsSection.COMPARISON_TABLE, dispatch, false)
      }
      {...headerProps}
    >
      <DragDropItemWithTarget
        isAfter={isAfter}
        dropTarget={(isInDragAndDropMode && target) || null}
        draggable={<th />}
      >
        <div
          className={styles.header}
          data-testid={`${
            children?.toString().split(',')[0] || 'no-children'
          }-header`}
        >
          {!isPinned && <GripIcon className={styles.gripIcon} />}
          <button
            className={pinClasses}
            onMouseDown={(e: MouseEvent<HTMLButtonElement>) =>
              e.stopPropagation()
            }
            onClick={onClicked}
          >
            <Pinned />
          </button>
          <span
            className={styles.bullet}
            style={{ backgroundColor: displayColor }}
          />
          <span className={styles.headerText}>{children}</span>
        </div>
      </DragDropItemWithTarget>
    </th>
  )
}
