import { quickPickValue } from '../vscode/quickPick'
import { Title } from '../vscode/title'

export const enum PLOT_TYPE {
  CUSTOM = 'custom',
  TOP_LEVEL = 'top-level'
}

export const pickPlotType = () =>
  quickPickValue(
    [
      {
        description:
          'Create a top-level plot definition by selecting data from a file',
        label: 'Top-Level',
        value: PLOT_TYPE.TOP_LEVEL
      },
      {
        description:
          'Create an extension-only plot by selecting one metric and one param from the experiments table',
        label: 'Custom',
        value: PLOT_TYPE.CUSTOM
      }
    ],
    {
      title: Title.SELECT_PLOT_TYPE
    }
  )
