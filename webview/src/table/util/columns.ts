import { Experiment } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'

export const getPlaceholder = (
  column: HeaderGroup<Experiment>,
  columns: HeaderGroup<Experiment>[]
): HeaderGroup<Experiment> | undefined =>
  columns.find(c => c.placeholderOf?.id === column.id)

export const isFirstLevelHeader = (id: string) => id.split(':').length - 1 === 1
