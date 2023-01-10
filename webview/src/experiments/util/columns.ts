import { Experiment, Column } from 'dvc/src/experiments/webview/contract'
import { Header } from '@tanstack/react-table'
import { CellValue } from '../components/table/content/Cell'

export const getPlaceholders = (
  column: Header<Experiment, CellValue>,
  columns: Header<Experiment, CellValue>[]
): Header<Experiment, CellValue>[] =>
  columns.filter(c => c.placeholderId === column.id)

const cleanPath = (path: string): string => path.split('/').slice(1).join('/')

export const getNodeSiblings = (orderedColumns: Column[], id: string) => {
  const nodeRep = orderedColumns.find(node => cleanPath(node.path) === id)
  return orderedColumns.filter(node => node.parentPath === nodeRep?.parentPath)
}

export const isFirstLevelHeader = (id: string) => id.split(':').length - 1 === 1

export const reorderColumnIds = (
  columnIds: string[],
  displacer: string[],
  displaced: string[]
) => {
  if (columnIds.length === 0 || displacer[0] === displaced[0]) {
    return columnIds
  }

  const displacerIndex = columnIds.indexOf(displacer[0])
  const displacedIndex = columnIds.indexOf(displaced[0])

  if (displacerIndex < displacedIndex) {
    return [
      ...columnIds.slice(0, displacerIndex),
      ...columnIds.slice(displacerIndex + displacer.length, displacedIndex),
      ...displaced,
      ...displacer,
      ...columnIds.slice(displacedIndex + displaced.length)
    ]
  }

  return [
    ...columnIds.slice(0, displacedIndex),
    ...displacer,
    ...displaced,
    ...columnIds.slice(displacedIndex + displaced.length, displacerIndex),
    ...columnIds.slice(displacerIndex + displacer.length)
  ]
}

export const leafColumnIds = (header: Header<Experiment, unknown>): string[] =>
  header.column.getLeafColumns().map(col => col.id)

export const EXPERIMENT_COLUMN_ID = 'id'

export const isExperimentColumn = (id: string): boolean =>
  id === EXPERIMENT_COLUMN_ID
