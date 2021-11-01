import { Experiment } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'

interface HeaderGroupWithOriginalId extends HeaderGroup<Experiment> {
  originalId: string
}

export const getPlaceholders = (
  column: HeaderGroup<Experiment>,
  columns: HeaderGroup<Experiment>[]
): HeaderGroup<Experiment>[] =>
  columns.filter(c => {
    const placeholderOfOriginalId = (c.placeholderOf as unknown as HeaderGroupWithOriginalId)?.originalId
    return c.placeholderOf?.id === column.id || placeholderOfOriginalId && placeholderOfOriginalId === column.id
  })

export const countUpperLevels = (column: HeaderGroup<Experiment>, columns: HeaderGroup<Experiment>[], previousLevel: number = 0): number => {
  const {parent, id} = column

  let nbLevels = previousLevel

  if (!parent) {
    const parentPlaceholders = getPlaceholders(column as HeaderGroup<Experiment>, columns)
    parentPlaceholders.forEach(parentPlaceholder => {
      nbLevels = countUpperLevels(parentPlaceholder, columns, nbLevels + 1)
    })
  } else {
    const last = parent.columns?.length && parent.columns[parent.columns.length - 1] || undefined
    if (last?.id === id) {
      const parentNode = columns.find(column => column.headers?.map(header => header.id).includes(id))
      nbLevels = countUpperLevels({...parentNode, id: parent.id} as HeaderGroup<Experiment>, columns, nbLevels + 1)
    }
  }

  return nbLevels
}

export const isFirstLevelHeader = (id: string) => id.split(':').length - 1 === 1
