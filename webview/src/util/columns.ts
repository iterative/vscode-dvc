import { Experiment } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'
import { Model } from '../model'

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

export const countUpperLevels = (
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
      nbLevels = countUpperLevels(parentPlaceholder, columns, nbLevels + 1)
    })
  } else {
    const orederedColumnsrep = Model.getInstance().columnsOrderRepresentation
    const nodeRep = orederedColumnsrep.find(
      node => cleanPath(node.path) === column.id
    )
    const siblings = orederedColumnsrep.filter(
      node => node.parentPath === nodeRep?.parentPath
    )
    const lastId =
      siblings?.length && cleanPath(siblings[siblings.length - 1].path)

    if (lastId === id || parent.placeholderOf) {
      nbLevels = countUpperLevels(
        parent as HeaderGroup<Experiment>,
        columns,
        nbLevels + 1
      )
    }
  }

  return nbLevels
}

export const isFirstLevelHeader = (id: string) => id.split(':').length - 1 === 1
