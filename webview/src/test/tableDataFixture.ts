import { copyReverseOriginalColors } from 'dvc/src/experiments/model/status/colors'
import {
  ExperimentStatus,
  Row,
  TableData
} from 'dvc/src/experiments/webview/contract'

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

const setRowProperty =
  (prop: keyof Row, value: unknown) =>
  (fixture: TableData, labelOrIds: string[]) => {
    return transformRows(fixture, labelOrIds, row => ({
      ...row,
      [prop]: value
    }))
  }

export const setExperimentsAsStarred = setRowProperty('starred', true)

export const setExperimentsAsSelected = (
  fixture: TableData,
  labelOrIds: string[]
) => {
  let colors = copyReverseOriginalColors()
  const nextColor = () => {
    if (colors.length === 0) {
      colors = copyReverseOriginalColors()
    }
    return colors.pop()
  }

  return transformRows(fixture, labelOrIds, row => ({
    ...row,
    displayColor: nextColor(),
    selected: true
  }))
}
export const setExperimentsAsRunning = setRowProperty(
  'status',
  ExperimentStatus.RUNNING
)
