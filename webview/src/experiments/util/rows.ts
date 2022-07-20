import { Experiment } from 'dvc/src/experiments/webview/contract'
import { Row } from 'react-table'

const addToSelected = (
  selectedForPlotsCount: number,
  row: Row<Experiment>
): number => selectedForPlotsCount + (row.original?.selected ? 1 : 0)

export const getSelectedForPlotsCount = (
  rows: Row<Experiment>[] = []
): number => {
  let selectedForPlotsCount = 0

  for (const row of rows) {
    selectedForPlotsCount = addToSelected(selectedForPlotsCount, row)

    selectedForPlotsCount =
      selectedForPlotsCount + getSelectedForPlotsCount(row.subRows)
  }

  return selectedForPlotsCount
}
