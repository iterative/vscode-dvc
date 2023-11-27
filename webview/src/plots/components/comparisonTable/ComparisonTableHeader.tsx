import cx from 'classnames'
import React, { MouseEvent } from 'react'
import styles from './styles.module.scss'
import { Pinned } from '../../../shared/components/icons'
import { GripIcon } from '../../../shared/components/dragDrop/GripIcon'
import { changeDragAndDropMode } from '../util'
import { PlotsSection } from 'dvc/src/plots/webview/contract'
import { useDispatch, useSelector } from 'react-redux'
import { useDragAndDrop } from '../../../shared/hooks/useDragAndDrop'
import { DropTarget } from './DropTarget'
import { ThemeProperty, getThemeValue } from '../../../util/styles'
import { PlotsState } from '../../store'

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
  const { ...dragAndDropProps } = useDragAndDrop({
    id,
    group: 'comparison',
    dropTarget: <DropTarget />,
    order,
    setOrder,
    disabledDropIds: pinnedColumn ? [pinnedColumn] : [],
    onDragEnd: () =>
      changeDragAndDropMode(PlotsSection.COMPARISON_TABLE, dispatch, true),
    shouldShowOnDrag: true,
    ghostElemStyle: {
      backgroundColor: getThemeValue(ThemeProperty.ACCENT_COLOR),
      color: getThemeValue(ThemeProperty.BACKGROUND_COLOR)
    }
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
        [styles.draggedColumn]: draggedId === id
      })}
      onMouseDown={() =>
        changeDragAndDropMode(PlotsSection.COMPARISON_TABLE, dispatch, false)
      }
      {...headerProps}
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
    </th>
  )
}
