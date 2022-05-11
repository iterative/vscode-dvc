import { definedAndNonEmpty } from '../../util/array'
import {
  QuickPickOptionsWithTitle,
  quickPickValue
} from '../../vscode/quickPick'
import { Toast } from '../../vscode/toast'
import { Column } from '../webview/contract'

export const pickFromColumns = (
  columns: Column[] | undefined,
  quickPickOptions: QuickPickOptionsWithTitle
) => {
  if (!definedAndNonEmpty(columns)) {
    return Toast.showError('There are no columns to select from.')
  }
  return quickPickValue<Column>(
    columns.map(column => ({
      description: column.path,
      label: column.name,
      value: column
    })),
    quickPickOptions
  )
}
