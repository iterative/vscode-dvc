import React, { useRef } from 'react'
import {
  AutoSizer,
  CellMeasurer,
  GridCellProps,
  CellMeasurerCache,
  Grid
} from 'react-virtualized'
import styles from './styles.module.scss'
import { DEFAULT_NB_ITEMS_PER_ROW } from '../../../plots/components/util'

interface VirtualizedGridProps {
  items: JSX.Element[]
  nbItemsPerRow: number
}

export const VirtualizedGrid: React.FC<VirtualizedGridProps> = ({
  items,
  nbItemsPerRow = DEFAULT_NB_ITEMS_PER_ROW
}) => {
  const cache = useRef(
    new CellMeasurerCache({
      defaultHeight: 200,
      defaultWidth: 200
    })
  )
  const cellRenderer = ({
    columnIndex,
    key,
    parent,
    rowIndex,
    style
  }: GridCellProps) => {
    const gridItem = items[rowIndex * nbItemsPerRow + columnIndex]

    return (
      gridItem && (
        <CellMeasurer key={key} cache={cache.current} parent={parent}>
          <gridItem.type
            {...gridItem.props}
            style={{ ...gridItem.props.style, style }}
          />
        </CellMeasurer>
      )
    )
  }
  const nbRows = Math.ceil(items.length / nbItemsPerRow)

  return (
    <div className={styles.grid}>
      <AutoSizer>
        {({ width, height }) => (
          <Grid
            height={height}
            width={width}
            deferredMeasurementCache={cache.current}
            rowHeight={cache.current.rowHeight}
            rowCount={nbRows}
            columnCount={nbItemsPerRow}
            columnWidth={cache.current.columnWidth}
            cellRenderer={cellRenderer}
          />
        )}
      </AutoSizer>
    </div>
  )
}
