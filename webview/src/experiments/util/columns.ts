import { Experiment } from 'dvc/src/experiments/webview/contract'
import { Header } from '@tanstack/react-table'
import {
  EXPERIMENT_COLUMN_ID,
  BRANCH_COLUMN_ID,
  COMMIT_COLUMN_ID
} from 'dvc/src/experiments/columns/constants'

export const isFirstLevelHeader = (id: string) => id.split(':').length - 1 === 1

type OrderAccumulator = { newOrder: string[]; firstDroppedFound: boolean }

const addDroppedAndDisplaced = (
  acc: OrderAccumulator,
  dropped: string[],
  displaced: string[]
) => {
  const droppedStartedLeftOfDisplaced = acc.firstDroppedFound
  const order = droppedStartedLeftOfDisplaced
    ? [...displaced, ...dropped]
    : [...dropped, ...displaced]
  acc.newOrder.push(...order)
}

const collectId = (
  acc: OrderAccumulator,
  columnId: string,
  dropped: string[],
  displaced: string[]
) => {
  if (columnId === displaced[0]) {
    addDroppedAndDisplaced(acc, dropped, displaced)
    return
  }
  if (displaced.includes(columnId)) {
    return
  }
  if (dropped.includes(columnId)) {
    acc.firstDroppedFound = true
    return
  }

  acc.newOrder.push(columnId)
}

const collectNewOrder = (
  columnIds: string[],
  dropped: string[],
  displaced: string[]
): string[] => {
  const acc: OrderAccumulator = {
    firstDroppedFound: false,
    newOrder: []
  }
  for (const columnId of columnIds) {
    collectId(acc, columnId, dropped, displaced)
  }
  return acc.newOrder
}

export const reorderColumnIds = (
  columnIds: string[],
  dropped: string[],
  displaced: string[]
) => {
  if (columnIds.length === 0 || dropped[0] === displaced[0]) {
    return columnIds
  }
  return collectNewOrder(columnIds, dropped, displaced)
}

export const leafColumnIds = (
  header: Header<Experiment, unknown>
): string[] => {
  const leafColumnIds: string[] = []
  for (const headers of header.getLeafHeaders()) {
    if (headers.subHeaders.length > 0) {
      continue
    }
    leafColumnIds.push(headers.column.id)
  }
  return leafColumnIds
}

export const isExperimentColumn = (id: string): boolean =>
  id === EXPERIMENT_COLUMN_ID

export const isDefaultColumn = (id: string) =>
  id === EXPERIMENT_COLUMN_ID ||
  id === BRANCH_COLUMN_ID ||
  id === COMMIT_COLUMN_ID
