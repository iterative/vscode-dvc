import { copyOriginalColors } from 'dvc/src/experiments/model/status/colors'
import { Row, TableData } from 'dvc/src/experiments/webview/contract'

const matchAndTransform = (
  rows: Row[],
  labelOrIds: string[],
  transform: (source: Row) => Row
): Row[] => {
  return rows.map(parent => {
    let newParent = parent

    if (labelOrIds.includes(parent.id) || labelOrIds.includes(parent.label)) {
      newParent = transform(parent)
    }

    return {
      ...newParent,
      subRows: matchAndTransform(newParent.subRows || [], labelOrIds, transform)
    }
  })
}

export const transformRows = (
  fixture: TableData,
  labelOrIds: string[],
  transform: (source: Row) => Row
) => {
  const [workspace, main] = fixture.rows

  const starredRows = [
    workspace,
    {
      ...main,
      subRows: matchAndTransform(main.subRows || [], labelOrIds, transform)
    }
  ]

  return {
    ...fixture,
    rows: starredRows
  } as TableData
}

export const setRowPropertyAsTrue =
  (prop: keyof Row) => (fixture: TableData, labelOrIds: string[]) => {
    return transformRows(fixture, labelOrIds, row => ({ ...row, [prop]: true }))
  }

export const setExperimentsAsStarred = setRowPropertyAsTrue('starred')

export const setExperimentsAsSelected = (
  fixture: TableData,
  labelOrIds: string[]
) => {
  let colors = copyOriginalColors().reverse()
  const nextColor = () => {
    if (colors.length === 0) {
      colors = copyOriginalColors().reverse()
    }
    return colors.pop()
  }

  return transformRows(fixture, labelOrIds, row => ({
    ...row,
    displayColor: nextColor(),
    selected: true
  }))
}
export const setExperimentsAsRunning = setRowPropertyAsTrue('running')
