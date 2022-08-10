import { Column } from '../webview/contract'

export type ColumnLike = { label: string; path: string; types?: string[] }

const starredColumnLike: ColumnLike = {
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
