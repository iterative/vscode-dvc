import { Column } from '../webview/contract'

export type ColumnLike = {
  firstValueType?: string
  label: string
  path: string
}

const starredColumnLike: ColumnLike = {
  firstValueType: 'boolean',
  label: '$(star-full)',
  path: 'starred'
}

export const addStarredToColumns = (
  columns: Column[] | undefined
): ColumnLike[] | undefined => {
  if (!columns?.length) {
    return
  }

  return [
    ...columns.map(({ label, path, firstValueType }) => ({
      firstValueType,
      label,
      path
    })),
    starredColumnLike
  ]
}
