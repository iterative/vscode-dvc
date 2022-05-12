import { PlotPath } from './collect'
import { definedAndNonEmpty } from '../../util/array'
import { Toast } from '../../vscode/toast'
import {
  QuickPickItemWithValue,
  quickPickManyValues
} from '../../vscode/quickPick'
import { Title } from '../../vscode/title'

type PlotPathWithSelected = PlotPath & { selected: boolean }

const getItem = (plotPath: PlotPathWithSelected) => ({
  label: plotPath.path,
  picked: plotPath.selected,
  value: plotPath
})

const collectItems = (
  plotPaths: PlotPathWithSelected[]
): QuickPickItemWithValue<PlotPathWithSelected>[] => {
  const acc: QuickPickItemWithValue<PlotPathWithSelected>[] = []

  for (const plotPath of plotPaths) {
    acc.push(getItem(plotPath))
  }

  return acc
}

export const pickPlotPaths = (
  paths?: PlotPathWithSelected[]
): Thenable<PlotPathWithSelected[] | undefined> => {
  if (!definedAndNonEmpty(paths)) {
    return Toast.showError('There are no plots to select.')
  }

  const items = collectItems(paths)

  return quickPickManyValues<PlotPathWithSelected>(items, {
    title: Title.SELECT_PLOTS
  })
}
