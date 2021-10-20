import { RowData, TableData } from 'dvc/src/experiments/webview/contract'
import { PlotItem } from './components/App'

const parseRows = (rows: RowData[]): PlotItem[] => {
  const items: PlotItem[] = []
  rows
    .reverse()
    .forEach(
      ({
        displayName: branchDisplayName,
        id: branchId,
        subRows: experiments
      }) => {
        experiments
          ?.reverse()
          .forEach(
            ({
              subRows: checkpoints,
              id: experimentId,
              displayName: experimentDisplayName
            }) => {
              if (checkpoints && checkpoints.length > 0) {
                checkpoints
                  .reverse()
                  .forEach(({ params, metrics, displayName }, i) => {
                    items.push({
                      branchDisplayName,
                      branchId,
                      displayName,
                      experimentDisplayName,
                      experimentId,
                      iteration: checkpoints.length - i,
                      metrics,
                      params
                    })
                  })
              }
            }
          )
      }
    )
  return items
}

const parseTableData = (tableData: TableData) => {
  if (tableData) {
    const { rows, columns } = tableData
    return { columns, items: parseRows(rows) }
  } else {
    return undefined
  }
}

export default parseTableData
