import { join } from 'path'
import { PathType } from './collect'
import { pickPlotPaths } from './quickPick'
import { quickPickManyValues } from '../../vscode/quickPick'
import { Toast } from '../../vscode/toast'
import { Title } from '../../vscode/title'

jest.mock('../../vscode/quickPick')
jest.mock('../../vscode/toast')

const mockedQuickPickManyValues = jest.mocked(quickPickManyValues)
const mockedToast = jest.mocked(Toast)
const mockedShowError = jest.fn()
mockedToast.showError = mockedShowError

beforeEach(() => {
  jest.resetAllMocks()
})

describe('pickPlotPaths', () => {
  it('should not call quickPickManyValues if undefined is provided', async () => {
    mockedQuickPickManyValues.mockResolvedValueOnce([])
    await pickPlotPaths(undefined)

    expect(mockedShowError).toBeCalledTimes(1)
    expect(mockedQuickPickManyValues).not.toBeCalled()
  })

  it('should not call quickPickManyValues if no plots paths are provided', async () => {
    mockedQuickPickManyValues.mockResolvedValueOnce([])
    await pickPlotPaths([])

    expect(mockedShowError).toBeCalledTimes(1)
    expect(mockedQuickPickManyValues).not.toBeCalled()
  })

  it('should call the quickPick with the correct items', async () => {
    mockedQuickPickManyValues.mockResolvedValueOnce([])

    const plotPaths = [
      {
        hasChildren: false,
        parentPath: 'logs',
        path: join('logs', 'loss.tsv'),
        selected: true,
        type: new Set([PathType.TEMPLATE_SINGLE])
      },
      {
        hasChildren: false,
        parentPath: 'logs',
        path: join('logs', 'acc.tsv'),
        selected: true,
        type: new Set([PathType.TEMPLATE_SINGLE])
      },
      {
        hasChildren: false,
        parentPath: 'logs',
        path: join('logs', 'fun.tsv'),
        selected: false,
        type: new Set([PathType.TEMPLATE_SINGLE])
      }
    ]

    await pickPlotPaths(plotPaths)

    expect(mockedShowError).not.toBeCalled()
    expect(mockedQuickPickManyValues).toBeCalledTimes(1)
    expect(mockedQuickPickManyValues).toBeCalledWith(
      [
        {
          label: join('logs', 'loss.tsv'),
          picked: true,
          value: plotPaths[0]
        },
        {
          label: join('logs', 'acc.tsv'),
          picked: true,
          value: plotPaths[1]
        },
        {
          label: join('logs', 'fun.tsv'),
          picked: false,
          value: plotPaths[2]
        }
      ],
      { title: Title.SELECT_PLOTS }
    )
  })
})
