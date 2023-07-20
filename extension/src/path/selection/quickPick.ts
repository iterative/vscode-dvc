import { definedAndNonEmpty } from '../../util/array'
import { Toast } from '../../vscode/toast'
import {
  QuickPickItemWithValue,
  quickPickManyValues
} from '../../vscode/quickPick'
import { Title } from '../../vscode/title'
import { Column } from '../../experiments/webview/contract'
import { PlotPath } from '../../plots/paths/collect'

type PathType = PlotPath | Column

type PathWithSelected<T extends PathType> = T & {
  selected: boolean
}

const collectDefaultItem = <T extends PathType>(
  element: PathWithSelected<T>
): QuickPickItemWithValue<PathWithSelected<T>> => ({
  label: element.path,
  picked: element.selected,
  value: element
})

const collectItems = <T extends PathType>(
  paths: PathWithSelected<T>[],
  collectItem: (
    element: PathWithSelected<T>
  ) => QuickPickItemWithValue<PathWithSelected<T>>
): QuickPickItemWithValue<PathWithSelected<T>>[] => {
  const acc: QuickPickItemWithValue<PathWithSelected<T>>[] = []

  for (const path of paths) {
    acc.push(collectItem(path))
  }

  return acc
}

export const pickPaths = <T extends PathType>(
  paths: PathWithSelected<T>[] | undefined,
  title:
    | typeof Title.SELECT_PLOTS
    | typeof Title.SELECT_COLUMNS
    | typeof Title.SELECT_FIRST_COLUMNS,
  collectItem: (
    element: PathWithSelected<T>
  ) => QuickPickItemWithValue<PathWithSelected<T>> = collectDefaultItem
): Thenable<PathWithSelected<T>[] | undefined> => {
  const type = Title.SELECT_PLOTS === title ? 'plots' : 'columns'

  if (!definedAndNonEmpty(paths)) {
    return Toast.showError(`There are no ${type} to select.`)
  }

  const items = collectItems(paths, collectItem)

  return quickPickManyValues<PathWithSelected<T>>(items, {
    title
  })
}
