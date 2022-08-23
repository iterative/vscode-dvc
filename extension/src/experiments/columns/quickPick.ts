import { ColumnLike } from './like'
import { timestampColumn } from './collect/timestamp'
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
  return quickPickValue<ColumnLike>(
    columnLikes
      .filter(columnLike => columnLike.path !== timestampColumn.path)
      .map(columnLike => ({
        description: columnLike.path,
        label: columnLike.label,
        value: columnLike
      })),
    quickPickOptions
  )
}
