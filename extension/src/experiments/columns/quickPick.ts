import { ColumnLike, starredColumnLike, tagsColumnLike } from './like'
import { definedAndNonEmpty } from '../../util/array'
import {
  QuickPickOptionsWithTitle,
  quickPickValue
} from '../../vscode/quickPick'
import { Toast } from '../../vscode/toast'

export const pickFromColumnLikes = (
  columnLikes: ColumnLike[] | undefined,
  quickPickOptions: QuickPickOptionsWithTitle
): Thenable<ColumnLike | undefined> => {
  if (!definedAndNonEmpty(columnLikes)) {
    return Toast.showError('There are no columns to select from.')
  }

  const items = []
  for (const columnLike of columnLikes) {
    if (
      [starredColumnLike.path, tagsColumnLike.path].includes(columnLike.path)
    ) {
      items.push({
        description: columnLike.description,
        label: columnLike.label,
        value: columnLike
      })
      continue
    }
    items.push({
      label: columnLike.path,
      value: columnLike
    })
  }

  return quickPickValue<ColumnLike>(items, quickPickOptions)
}
