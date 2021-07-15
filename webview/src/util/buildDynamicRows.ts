import { Experiment } from '../../../extension/src/experiments/webview/contract'

const buildDynamicRows = (
  rows: Experiment[],
  parentPath?: string
): Experiment[] =>
  rows
    .filter(row =>
      parentPath ? row.parentPath === parentPath : !row.parentPath
    )
    .map(data => {
      const { path } = data

      const subRows = buildDynamicRows(rows, path)
      if (!subRows?.length) {
        return data
      }
      return { ...data, subRows }
    })

export default buildDynamicRows
