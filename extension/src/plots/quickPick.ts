import { quickPickValue } from '../vscode/quickPick'
import { Title } from '../vscode/title'

export const enum PLOT_TYPE {
  CUSTOM = 'custom',
  DATA_SERIES = 'data-series'
}

export const pickPlotType = () =>
  quickPickValue(
    [
      {
        description:
          'Create a data series plot definition by selecting data from one or more files (To select multiple files, hold the Ctrl/Command key and click on the files.).',
        label: 'Data Series',
        value: PLOT_TYPE.DATA_SERIES
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
