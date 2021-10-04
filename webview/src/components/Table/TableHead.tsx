import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment } from 'dvc/src/experiments/webview/contract'
import React from 'react'
import { HeaderGroup, TableInstance } from 'react-table'
import cx from 'classnames'
import styles from './styles.module.scss'
import { getPlaceholder } from '../../util/columns'

interface TableHeadProps {
  instance: TableInstance<Experiment>
  sorts: SortDefinition[]
}

const HeaderButtons: React.FC<{
  column: HeaderGroup<Experiment>
  nbColumns: number
  position: number
  onColumnOrderChanged: (oldPosition: number, newPosition: number) => void
}> = ({ column, nbColumns, position, onColumnOrderChanged }) => {
  const showButtons =
    !column.placeholderOf && column.id !== 'id' && !column.columns
  const showLeftButton = position > 1
  const showRightButton = position < nbColumns - 1
  const moveColumnLeft = () => onColumnOrderChanged(position, position - 1)
  const moveColumnRight = () => onColumnOrderChanged(position, position + 1)

  return (
    (showButtons && (
      <div>
        {showLeftButton && (
          <button className={styles.arrowLeft} onClick={moveColumnLeft}>
            ←
          </button>
        )}
        {showRightButton && (
          <button className={styles.arrowRight} onClick={moveColumnRight}>
            →
          </button>
        )}
      </div>
    )) ||
    null
  )
}

export const MergedHeaderGroup: React.FC<{
  headerGroup: HeaderGroup<Experiment>
  columns: HeaderGroup<Experiment>[]
  sorts: SortDefinition[]
  onColumnOrderChanged: (oldPosition: number, newPosition: number) => void
}> = ({ headerGroup, sorts, columns, onColumnOrderChanged }) => (
  <div
    {...headerGroup.getHeaderGroupProps({
      className: cx(styles.tr, styles.headerRow)
    })}
  >
    {headerGroup.headers.map((column, i) => {
      const hasPlaceholder = getPlaceholder(column, columns)
      const isSortedWithPlaceholder = (sort: SortDefinition) =>
        sort.path === column.placeholderOf?.id ||
        (!column.placeholderOf && !hasPlaceholder && sort.path === column.id)

      return (
        <div
          {...column.getHeaderProps({
            className: cx(
              styles.th,
              column.placeholderOf
                ? styles.placeholderHeaderCell
                : styles.headerCell,
              {
                [styles.paramHeaderCell]: column.id.includes('params'),
                [styles.metricHeaderCell]: column.id.includes('metric'),
                [styles.firstLevelHeader]:
                  column.id.split(':').length - 1 === 1,
                [styles.sortingHeaderCellAsc]: sorts.filter(
                  sort => !sort.descending && isSortedWithPlaceholder(sort)
                ).length,
                [styles.sortingHeaderCellDesc]: sorts.filter(
                  sort => sort.descending && sort.path === column.id
                ).length
              }
            )
          })}
          key={column.id}
          data-testid={`header-${column.id}`}
        >
          <div>{column.render('Header')}</div>
          <HeaderButtons
            column={column}
            nbColumns={headerGroup.headers.length}
            position={i}
            onColumnOrderChanged={onColumnOrderChanged}
          />
        </div>
      )
    })}
  </div>
)

export const TableHead: React.FC<TableHeadProps> = ({
  instance: { headerGroups, setColumnOrder, allColumns },
  sorts
}) => {
  const allHeaders: HeaderGroup<Experiment>[] = []
  headerGroups.forEach(headerGroup => allHeaders.push(...headerGroup.headers))

  const currentColOrder = React.useRef<string[]>([])

  const changeColumnOrder = (oldPosition: number, newPosition: number) => {
    const colOrder = [...currentColOrder.current]
    const itemId = colOrder[oldPosition]
    colOrder.splice(oldPosition, 1)
    colOrder.splice(newPosition, 0, itemId)
    setColumnOrder(colOrder)
  }
  currentColOrder.current = allColumns?.map(o => o.id)

  return (
    <div className={styles.thead}>
      {headerGroups.map((headerGroup, i) => (
        <MergedHeaderGroup
          headerGroup={headerGroup}
          columns={allHeaders}
          sorts={sorts}
          onColumnOrderChanged={changeColumnOrder}
          key={`header-group-${headerGroup.id}-${i}`}
        />
      ))}
    </div>
  )
}
