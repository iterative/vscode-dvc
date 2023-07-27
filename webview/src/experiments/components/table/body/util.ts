import { Row } from '@tanstack/react-table'
import {
  Experiment,
  WORKSPACE_BRANCH
} from 'dvc/src/experiments/webview/contract'

export const collectBranchWithRows = (
  rows: Row<Experiment>[]
): [string | typeof WORKSPACE_BRANCH, Row<Experiment>[]][] => {
  const branchesWithRows: [
    string | typeof WORKSPACE_BRANCH,
    Row<Experiment>[]
  ][] = []

  let branchRows = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const branch = row.original.branch
    if (branch === undefined) {
      continue
    }
    const next = rows[i + 1]
    branchRows.push(row)
    if (!next || next.original.branch !== branch) {
      branchesWithRows.push([branch, branchRows])
      branchRows = []
    }
  }

  return branchesWithRows
}
