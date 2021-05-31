import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { ExperimentsTable, Experiments } from '..'
import { CliRunner } from '../../cli/runner'
import { Config } from '../../Config'
import { showExperimentsTableThenRun } from './register'
import { runQueued, runReset } from './runner'
import { quickPickOne } from '../../vscode/quickPick'
import { CliReader } from '../../cli/reader'

const mockedShowWebview = jest.fn()
const mockedDisposable = mocked(Disposable)
const mockedRun = jest.fn()
const mockedDvcRoot = '/my/dvc/root'
const mockedGetDefaultProject = jest.fn()
const mockedQuickPickOne = mocked(quickPickOne)
const mockedConfig = ({
  getDefaultProject: mockedGetDefaultProject
} as unknown) as Config

jest.mock('@hediet/std/disposable')
jest.mock('../../vscode/quickPick')
jest.mock('./quickPick')

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValueOnce(({
    track: function<T>(disposable: T): T {
      return disposable
    }
  } as unknown) as (() => void) & Disposer)
})

describe('showExperimentsTableThenRun', () => {
  it('should call the runner with the correct args when runQueued is provided', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(mockedDvcRoot)

    const experiments = new Experiments(mockedConfig, {} as CliReader, {
      '/my/dvc/root': ({
        showWebview: mockedShowWebview,
        getDvcRoot: () => mockedDvcRoot
      } as unknown) as ExperimentsTable,
      '/other/dvc/root': ({} as unknown) as ExperimentsTable
    })

    await showExperimentsTableThenRun(
      experiments,
      ({
        run: mockedRun,
        onDidCompleteProcess: jest.fn()
      } as unknown) as CliRunner,
      runQueued
    )

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).not.toBeCalled()
    expect(mockedShowWebview).toBeCalledTimes(1)
    expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run', '--run-all')
  })

  it('should call the runner with the correct args when runReset is provided', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(undefined)
    mockedQuickPickOne.mockResolvedValueOnce('/my/dvc/root')

    const experiments = new Experiments(mockedConfig, {} as CliReader, {
      '/my/dvc/root': ({
        showWebview: mockedShowWebview,
        getDvcRoot: () => mockedDvcRoot
      } as unknown) as ExperimentsTable,
      '/my/b/dvc/root': ({
        showWebview: jest.fn(),
        getDvcRoot: () => '/my/b/dvc/root'
      } as unknown) as ExperimentsTable
    })

    await showExperimentsTableThenRun(
      experiments,
      ({
        run: mockedRun,
        onDidCompleteProcess: jest.fn()
      } as unknown) as CliRunner,
      runReset
    )

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).toBeCalledTimes(1)
    expect(mockedQuickPickOne).toBeCalledWith(
      [mockedDvcRoot, '/my/b/dvc/root'],
      'Select which project to run command against'
    )
    expect(mockedShowWebview).toBeCalledTimes(1)
    expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run', '--reset')
  })
})
