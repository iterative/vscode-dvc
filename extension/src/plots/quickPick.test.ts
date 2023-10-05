import { pickPlotType } from './quickPick'
import { quickPickValue } from '../vscode/quickPick'
import { Title } from '../vscode/title'

jest.mock('../vscode/quickPick')

const mockedQuickPickValue = jest.mocked(quickPickValue)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickPlotType', () => {
  it('should call a quick pick with possible plot types', async () => {
    mockedQuickPickValue.mockResolvedValueOnce(undefined)

    await pickPlotType()

    expect(mockedQuickPickValue).toHaveBeenCalledWith(
      [
        {
          description:
            'Create a data series plot definition by selecting data from one or more files (To select multiple files, hold the Ctrl/Command key and click on the files.).',
          label: 'Data Series',
          value: 'data-series'
        },
        {
          description:
            'Create an extension-only plot by selecting one metric and one param from the experiments table',
          label: 'Custom',
          value: 'custom'
        }
      ],
      {
        title: Title.SELECT_PLOT_TYPE
      }
    )
  })
})
