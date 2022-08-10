import { ColumnLike } from './quickPick'
import { Column } from '../webview/contract'

const starredColumnLike = {
  label: '$(star-full)',
  path: 'starred',
  types: ['boolean']
}

export const addStarredToColumns = (
  columns: Column[] | undefined
): ColumnLike[] | undefined => {
  if (!columns?.length) {
    return
  }

  return [
    ...columns.map(({ label, path, types }) => ({ label, path, types })),
    starredColumnLike
  ]
}
