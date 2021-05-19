import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { join } from 'path'
import { ExperimentsTable, Experiments } from '..'
import { Runner } from '../../cli/Runner'
import { Config } from '../../Config'
import {
  getExecutionOptionsThenRun,
  showExperimentsTableThenRun
} from './register'
import { runQueued, runReset } from './runner'
import { quickPickSingle } from '../../vscode/quickPick'

const mockedShowWebview = jest.fn()
const mockedDisposable = mocked(Disposable)
const mockedRun = jest.fn()
const mockedDvcRoot = '/my/dvc/root'
const mockedGetDefaultProject = jest.fn()
const mockedQuickPickSingle = mocked(quickPickSingle)
const mockedGetExecutionOptions = jest.fn()
const mockedConfig = ({
  getDefaultProject: mockedGetDefaultProject,
  getExecutionOptions: mockedGetExecutionOptions
} as unknown) as Config

jest.mock('@hediet/std/disposable')
jest.mock('../../vscode/quickPick')

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

    const experiments = new Experiments(mockedConfig, {
      '/my/dvc/root': ({
        showWebview: mockedShowWebview,
        getDvcRoot: () => mockedDvcRoot
      } as unknown) as ExperimentsTable
    })

    await showExperimentsTableThenRun(
      experiments,
      ({
        run: mockedRun,
        onDidCompleteProcess: jest.fn()
      } as unknown) as Runner,
      runQueued
    )

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickSingle).not.toBeCalled()
    expect(mockedShowWebview).toBeCalledTimes(1)
    expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run', '--run-all')
  })

  it('should call the runner with the correct args when runReset is provided', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(undefined)
    mockedQuickPickSingle.mockResolvedValueOnce(mockedDvcRoot)

    const experiments = new Experiments(mockedConfig, {
      '/my/dvc/root': ({
        showWebview: mockedShowWebview,
        getDvcRoot: () => mockedDvcRoot
      } as unknown) as ExperimentsTable,
      '/my/other/dvc/root': ({
        showWebview: jest.fn(),
        getDvcRoot: () => '/my/other/dvc/root'
      } as unknown) as ExperimentsTable
    })

    await showExperimentsTableThenRun(
      experiments,
      ({
        run: mockedRun,
        onDidCompleteProcess: jest.fn()
      } as unknown) as Runner,
      runReset
    )

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickSingle).toBeCalledTimes(1)
    expect(mockedQuickPickSingle).toBeCalledWith(
      [mockedDvcRoot, '/my/other/dvc/root'],
      'Select which project to run command against'
    )
    expect(mockedShowWebview).toBeCalledTimes(1)
    expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run', '--reset')
  })
})

describe('getExecutionOptionsThenRun', () => {
  it('should call the correct function with the correct parameters', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(undefined)
    mockedQuickPickSingle.mockResolvedValueOnce(mockedDvcRoot)
    const cliPath = join(mockedDvcRoot, '.env', 'bin', 'dvc')
    mockedGetExecutionOptions.mockReturnValueOnce({
      cliPath,
      pythonBinPath: undefined,
      cwd: '/my'
    })

    const experiments = new Experiments(mockedConfig, {
      '/my/dvc/root': ({
        showWebview: mockedShowWebview,
        getDvcRoot: () => mockedDvcRoot
      } as unknown) as ExperimentsTable,
      '/my/mocked/dvc/root': ({
        showWebview: jest.fn(),
        getDvcRoot: () => '/my/mocked/dvc/root'
      } as unknown) as ExperimentsTable
    })

    const mockedExpFunc = jest.fn()
    await getExecutionOptionsThenRun(experiments, mockedExpFunc)

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickSingle).toBeCalledTimes(1)
    expect(mockedExpFunc).toBeCalledTimes(1)
    expect(mockedExpFunc).toBeCalledWith({
      cliPath,
      pythonBinPath: undefined,
      cwd: mockedDvcRoot
    })
  })
})
