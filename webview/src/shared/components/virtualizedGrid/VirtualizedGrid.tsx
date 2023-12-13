import { DEFAULT_NB_ITEMS_PER_ROW } from 'dvc/src/plots/webview/contract'
import React, { PropsWithChildren, useRef } from 'react'
import {
  AutoSizer,
  CellMeasurer,
  GridCellProps,
  CellMeasurerCache,
  Grid
} from 'react-virtualized'
import styles from './styles.module.scss'

interface VirtualizedGridProps {
  nbItemsPerRow: number
  children: JSX.Element[]
}

export const OVERSCAN_ROW_COUNT = 15

export const VirtualizedGrid: React.FC<
  PropsWithChildren<VirtualizedGridProps>
> = ({ children, nbItemsPerRow = DEFAULT_NB_ITEMS_PER_ROW }) => {
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
    const gridItem = children[rowIndex * nbItemsPerRow + columnIndex]

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
  const nbRows = Math.ceil(children.length / nbItemsPerRow)

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
            overscanRowCount={OVERSCAN_ROW_COUNT}
          />
        )}
      </AutoSizer>
    </div>
  )
}
