import { Experiment } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'
import { isStorybook } from './storybook'
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
    const orederedColumnsrep = !isStorybook
      ? Model.getInstance().columnsOrderRepresentation
      : []
    const nodeRep = orederedColumnsrep.find(
      node => node.path.split('/')[1] === column.id
    )
    const siblings = orederedColumnsrep.filter(
      node => node.parentPath === nodeRep?.parentPath
    )
    const lastId = !isStorybook
      ? siblings?.length && siblings[siblings.length - 1].path.split('/')[1]
      : parent.columns?.length && parent.columns[parent.columns.length - 1].id
    if (lastId === id) {
      const parentNode = columns.find(column =>
        column.headers?.map(header => header.id).includes(id)
      )
      nbLevels = countUpperLevels(
        { ...parentNode, id: parent.id } as HeaderGroup<Experiment>,
        columns,
        nbLevels + 1
      )
    }
  }

  return nbLevels
}

export const isFirstLevelHeader = (id: string) => id.split(':').length - 1 === 1
