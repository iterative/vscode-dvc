import React, { createRef, useEffect } from 'react'
import { PlotsSection, Revision } from 'dvc/src/plots/webview/contract'
import cx from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { DropTarget } from './DropTarget'
import { ComparisonTableHeader } from './ComparisonTableHeader'
import { DragDropContainer } from '../../../shared/components/dragDrop/DragDropContainer'
import { PlotsState } from '../../store'
import { getThemeValue, ThemeProperty } from '../../../util/styles'
import { changeDragAndDropMode } from '../util'

export type ComparisonTableColumn = Revision

const POSITION_ADJUSTMENTS = 51 - 4 // 4 is equal to the gap in the comparison table and 51 is the height of the section header

const setHeaderTop = (head: HTMLTableSectionElement, top: number) => {
  for (const header of head.firstChild?.childNodes || []) {
    ;(header as HTMLTableCellElement).style.top = `${top}px`
  }
}
interface ComparisonTableHeadProps {
  columns: ComparisonTableColumn[]
  pinnedColumn: string
  setColumnsOrder: (columns: string[]) => void
  setPinnedColumn: (column: string) => void
}

export const ComparisonTableHead: React.FC<ComparisonTableHeadProps> = ({
  columns,
  pinnedColumn,
  setColumnsOrder,
  setPinnedColumn
}) => {
  const dispatch = useDispatch()
  const draggedId = useSelector(
    (state: PlotsState) => state.dragAndDrop.draggedRef?.itemId
  )
  const isInDragAndDropMode = useSelector(
    (state: PlotsState) => state.comparison.isInDragAndDropMode
  )
  const ribbonHeight = useSelector((state: PlotsState) => state.ribbon.height)
  const headRef = createRef<HTMLTableSectionElement>()

  useEffect(() => {
    const adjustedRibbonHeight = ribbonHeight + POSITION_ADJUSTMENTS
    const calculateTop = () => {
      if (headRef.current) {
        const headerPosition = headRef.current.getBoundingClientRect().top
        const top =
          headerPosition - POSITION_ADJUSTMENTS < 0
            ? adjustedRibbonHeight - headerPosition
            : 0
        setHeaderTop(headRef.current, top)
      }
    }

    window.addEventListener('scroll', calculateTop)

    return () => {
      window.removeEventListener('scroll', calculateTop)
    }
  }, [ribbonHeight, headRef])

  const items = columns.map(
    ({ label, id, displayColor, description, commit }) => {
      const isPinned = label === pinnedColumn
      return (
        <th
          key={id}
          id={id}
          className={cx(styles.comparisonTableHeader, {
            [styles.pinnedColumnHeader]: isPinned,
            [styles.draggedColumn]: draggedId === id
          })}
          onMouseDown={() =>
            changeDragAndDropMode(
              PlotsSection.COMPARISON_TABLE,
              dispatch,
              false
            )
          }
        >
          <ComparisonTableHeader
            isPinned={isPinned}
            onClicked={() => setPinnedColumn(id)}
            displayColor={displayColor}
          >
            {label}
            {!commit && description && (
              <span className={styles.experimentName}>{description}</span>
            )}
          </ComparisonTableHeader>
        </th>
      )
    }
  )

  return (
    <thead data-testid="comparison-table-head" ref={headRef}>
      <tr>
        {isInDragAndDropMode ? (
          <DragDropContainer
            order={columns.map(col => col.id)}
            setOrder={setColumnsOrder}
            disabledDropIds={[pinnedColumn]}
            items={items}
            group="comparison"
            dropTarget={<DropTarget />}
            ghostElemStyle={{
              backgroundColor: getThemeValue(ThemeProperty.ACCENT_COLOR),
              color: getThemeValue(ThemeProperty.BACKGROUND_COLOR)
            }}
            onDragEnd={() =>
              changeDragAndDropMode(
                PlotsSection.COMPARISON_TABLE,
                dispatch,
                true
              )
            }
            shouldShowOnDrag
          />
        ) : (
          items
        )}
      </tr>
    </thead>
  )
}
