import { copyOriginalColors } from 'dvc/src/common/colors'
import { Commit } from 'dvc/src/experiments/webview/contract'
import { TableDataState } from '../experiments/state/tableDataSlice'

const matchAndTransform = (
  rows: Commit[],
  labelOrIds: string[],
  transform: (source: Commit) => Commit
): Commit[] => {
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

const transformRows = (
  fixture: TableDataState,
  labelOrIds: string[],
  transform: (source: Commit) => Commit
): TableDataState => {
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
  }
}

const setRowProperty =
  (prop: keyof Commit, value: unknown) =>
  (fixture: TableDataState, labelOrIds: string[]) => {
    return transformRows(fixture, labelOrIds, row => ({
      ...row,
      [prop]: value
    }))
  }

export const setExperimentsAsStarred = setRowProperty('starred', true)

export const setExperimentsAsSelected = (
  fixture: TableDataState,
  labelOrIds: string[]
): TableDataState => {
  let colors = [...copyOriginalColors()].reverse()
  const nextColor = () => {
    if (colors.length === 0) {
      colors = copyOriginalColors()
    }
    return colors.pop()
  }

  return transformRows(fixture, labelOrIds, row => ({
    ...row,
    displayColor: nextColor(),
    selected: true
  }))
}
