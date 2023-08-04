import { Header } from '@tanstack/react-table'
import { SortDefinition } from 'dvc/src/experiments/model/sortBy'
import { Experiment } from 'dvc/src/experiments/webview/contract'

export enum SortOrder {
  ASCENDING = 'Sort Ascending',
  DESCENDING = 'Sort Descending',
  NONE = 'Remove Sort'
}

const possibleOrders = {
  false: SortOrder.ASCENDING,
  true: SortOrder.DESCENDING,
  undefined: SortOrder.NONE
} as const

export const isFromExperimentColumn = (header: Header<Experiment, unknown>) =>
  header.column.id === 'id' || header.column.id.startsWith('id_placeholder')

export const getSortDetails = (
  header: Header<Experiment, unknown>,
  sorts: SortDefinition[]
): { id: string; isSortable: boolean; sortOrder: SortOrder } => {
  const isNotExperiments = !isFromExperimentColumn(header)
  const isSortable = isNotExperiments && header.column.columns.length <= 1
  const baseColumn =
    header.headerGroup.headers.find(
      h => h.column.id === header.placeholderId
    ) || header.column
  const sort = sorts.find(sort => sort.path === baseColumn.id)

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const sortOrder: SortOrder = possibleOrders[`${sort?.descending}`]

  return { id: baseColumn.id, isSortable, sortOrder }
}
