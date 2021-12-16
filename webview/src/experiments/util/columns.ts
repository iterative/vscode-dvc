import { Experiment, MetricOrParam } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'

interface HeaderGroupWithOriginalId extends HeaderGroup<Experiment> {
  originalId: string
}

export const getPlaceholders = (
  column: HeaderGroup<Experiment>,
  columns: HeaderGroup<Experiment>[]
): HeaderGroup<Experiment>[] =>
  columns.filter(c => {
    const placeholderOfOriginalId = (
      c.placeholderOf as unknown as HeaderGroupWithOriginalId
    )?.originalId
    return (
      c.placeholderOf?.id === column.id ||
      (placeholderOfOriginalId && placeholderOfOriginalId === column.id)
    )
  })

const cleanPath = (path: string): string => path.split('/').slice(1).join('/')

export const getNodeSiblings = (
  orderedColumns: MetricOrParam[],
  id: string
) => {
  const nodeRep = orderedColumns.find(node => cleanPath(node.path) === id)
  return orderedColumns.filter(node => node.parentPath === nodeRep?.parentPath)
}

export const countUpperLevels = (
  orderedColumns: MetricOrParam[],
  column: HeaderGroup<Experiment>,
  columns: HeaderGroup<Experiment>[],
  previousLevel = 0
): number => {
  const { parent, id } = column

  let nbLevels = previousLevel

  if (!parent) {
    const parentPlaceholders = getPlaceholders(
      column as HeaderGroup<Experiment>,
      columns
    )
    parentPlaceholders.forEach(parentPlaceholder => {
      nbLevels = countUpperLevels(
        orderedColumns,
        parentPlaceholder,
        columns,
        nbLevels + 1
      )
    })
    return nbLevels
  }
  const siblings = getNodeSiblings(orderedColumns, column.id)
  const lastId =
    siblings?.length && cleanPath(siblings[siblings.length - 1].path)

  if (lastId === id || parent.placeholderOf) {
    nbLevels = countUpperLevels(
      orderedColumns,
      parent as HeaderGroup<Experiment>,
      columns,
      nbLevels + 1
    )
  }
  return nbLevels
}

export const isFirstLevelHeader = (id: string) => id.split(':').length - 1 === 1
