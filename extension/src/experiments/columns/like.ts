import { Column } from '../webview/contract'

export type ColumnLike = {
  firstValueType?: string
  description?: string
  label: string
  path: string
}

export const starredColumnLike: ColumnLike = {
  description: '$(star-full)',
  firstValueType: 'boolean',
  label: 'Starred',
  path: 'starred'
}

export const tagsColumnLike: ColumnLike = {
  description: '$(git-commit)',
  firstValueType: 'tags',
  label: 'Git Tag',
  path: 'Git Tag'
}

export const addToColumns = (
  columns: Column[] | undefined,
  ...columnLikes: ColumnLike[]
): ColumnLike[] | undefined => {
  if (!columns?.length) {
    return
  }

  return [
    ...columnLikes,
    ...columns.map(({ label, path, firstValueType }) => ({
      firstValueType,
      label,
      path
    }))
  ]
}
