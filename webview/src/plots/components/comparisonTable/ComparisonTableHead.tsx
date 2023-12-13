import React, { createRef, useEffect } from 'react'
import { Revision } from 'dvc/src/plots/webview/contract'
import { useSelector } from 'react-redux'
import styles from './styles.module.scss'
import { ComparisonTableHeader } from './ComparisonTableHeader'
import { PlotsState } from '../../store'

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
      return (
        <ComparisonTableHeader
          key={id}
          pinnedColumn={pinnedColumn}
          onClicked={() => setPinnedColumn(id)}
          displayColor={displayColor}
          id={id}
          order={columns.map(col => col.id)}
          setOrder={setColumnsOrder}
        >
          {label}
          {!commit && description && (
            <span className={styles.experimentName}>{description}</span>
          )}
        </ComparisonTableHeader>
      )
    }
  )

  return (
    <thead data-testid="comparison-table-head" ref={headRef}>
      <tr>{items}</tr>
    </thead>
  )
}
