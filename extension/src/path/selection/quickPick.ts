import { definedAndNonEmpty } from '../../util/array'
import { Toast } from '../../vscode/toast'
import {
  QuickPickItemWithValue,
  quickPickManyValues
} from '../../vscode/quickPick'
import { Title } from '../../vscode/title'
import { Column, ColumnType } from '../../experiments/webview/contract'
import { PlotPath } from '../../plots/paths/collect'

type PathType = PlotPath | Column

type PathWithSelected<T extends PathType> = T & {
  selected: boolean
}

const getItem = <T extends PathType>(element: PathWithSelected<T>) => ({
  label: element.type === ColumnType.TIMESTAMP ? element.label : element.path,
  picked: element.selected,
  value: element
})

const collectItems = <T extends PathType>(
  paths: PathWithSelected<T>[]
): QuickPickItemWithValue<PathWithSelected<T>>[] => {
  const acc: QuickPickItemWithValue<PathWithSelected<T>>[] = []

  for (const path of paths) {
    acc.push(getItem(path))
  }

  return acc
}

export const pickPaths = <T extends PathType>(
  type: 'plots' | 'columns',
  paths?: PathWithSelected<T>[]
): Thenable<PathWithSelected<T>[] | undefined> => {
  const title = type === 'plots' ? Title.SELECT_PLOTS : Title.SELECT_COLUMNS

  if (!definedAndNonEmpty(paths)) {
    return Toast.showError(`There are no ${type} to select.`)
  }
  const items = collectItems(paths)

  return quickPickManyValues<PathWithSelected<T>>(items, {
    title
  })
}
