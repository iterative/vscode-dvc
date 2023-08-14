import { Row } from '@tanstack/react-table'
import { VirtualItem } from '@tanstack/react-virtual'
import {
  Experiment,
  WORKSPACE_BRANCH
} from 'dvc/src/experiments/webview/contract'

const isLastVirtualRow = (
  virtualIndex: number,
  virtualRowsLength: number
): boolean => virtualIndex === virtualRowsLength - 1

const isLastRowForBranch = (
  next: Row<Experiment>,
  branch: string | null
): boolean => !next || next.original.branch !== branch

export const collectBranchWithRows = (
  virtualRows: VirtualItem[],
  rows: Row<Experiment>[]
): [string | typeof WORKSPACE_BRANCH, Row<Experiment>[]][] => {
  const branchesWithRows: [
    string | typeof WORKSPACE_BRANCH,
    Row<Experiment>[]
  ][] = []

  let branchRows = []

  for (
    let virtualIndex = 0;
    virtualIndex < virtualRows.length;
    virtualIndex++
  ) {
    const i = virtualRows[virtualIndex].index
    const row = rows[i]
    const branch = row.original.branch
    if (branch === undefined) {
      continue
    }
    const next = rows[i + 1]
    branchRows.push(row)
    if (
      isLastRowForBranch(next, branch) ||
      isLastVirtualRow(virtualIndex, virtualRows.length)
    ) {
      branchesWithRows.push([branch, branchRows])
      branchRows = []
    }
  }

  return branchesWithRows
}
