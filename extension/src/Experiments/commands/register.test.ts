import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { join } from 'path'
import { ExperimentsTable, Experiments } from '..'
import { CliRunner } from '../../cli/runner'
import { Config } from '../../Config'
import {
  getExperimentNameThenRun,
  getExecutionOptionsThenRun,
  showExperimentsTableThenRun
} from './register'
import { runQueued, runReset } from './runner'
import { quickPickOne } from '../../vscode/quickPick'
import { CliReader } from '../../cli/reader'
import { pickExperimentName } from './quickPick'

const mockedShowWebview = jest.fn()
const mockedDisposable = mocked(Disposable)
const mockedRun = jest.fn()
const mockedDvcRoot = '/my/dvc/root'
const mockedGetDefaultProject = jest.fn()
const mockedGetExecutionOptions = jest.fn()
const mockedQuickPickOne = mocked(quickPickOne)
const mockedPickExperimentName = mocked(pickExperimentName)
const mockedConfig = ({
  getDefaultProject: mockedGetDefaultProject,
  getExecutionOptions: mockedGetExecutionOptions
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

describe('getExecutionOptionsThenRun', () => {
  it('should call the correct function with the correct parameters if a project is picked', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(undefined)
    mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
    const cliPath = join(mockedDvcRoot, '.env', 'bin', 'dvc')
    mockedGetExecutionOptions.mockReturnValueOnce({
      cliPath,
      pythonBinPath: undefined,
      cwd: '/my'
    })

    const experiments = new Experiments(mockedConfig, {} as CliReader, {
      '/my/dvc/root': ({
        showWebview: mockedShowWebview,
        getDvcRoot: () => mockedDvcRoot
      } as unknown) as ExperimentsTable,
      '/my/other/dvc/root': ({
        showWebview: jest.fn(),
        getDvcRoot: () => '/my/other/dvc/root'
      } as unknown) as ExperimentsTable
    })

    const mockedExpFunc = jest.fn()
    await getExecutionOptionsThenRun(experiments, mockedExpFunc)

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).toBeCalledTimes(1)
    expect(mockedExpFunc).toBeCalledTimes(1)
    expect(mockedExpFunc).toBeCalledWith({
      cliPath,
      pythonBinPath: undefined,
      cwd: mockedDvcRoot
    })
  })

  it('should not call the function if a project is not picked', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(undefined)
    mockedQuickPickOne.mockResolvedValueOnce(undefined)

    const experiments = new Experiments(mockedConfig, {} as CliReader, {
      '/my/dvc/root': ({
        showWebview: mockedShowWebview,
        getDvcRoot: () => mockedDvcRoot
      } as unknown) as ExperimentsTable,
      '/my/test/dvc/root': ({
        showWebview: jest.fn(),
        getDvcRoot: () => '/my/test/dvc/root'
      } as unknown) as ExperimentsTable
    })

    const mockedExpFunc = jest.fn()
    await getExecutionOptionsThenRun(experiments, mockedExpFunc)

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).toBeCalledTimes(1)
    expect(mockedGetExecutionOptions).not.toBeCalled()
    expect(mockedExpFunc).not.toBeCalled()
  })
})

describe('getExperimentNameThenRun', () => {
  it('should call the correct function with the correct parameters if a project and experiment are picked', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(undefined)
    mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
    mockedPickExperimentName.mockResolvedValueOnce('exp-123')
    const cliPath = join(mockedDvcRoot, '.env', 'bin', 'dvc')
    mockedGetExecutionOptions.mockReturnValueOnce({
      cliPath,
      pythonBinPath: undefined,
      cwd: '/my'
    })

    const experiments = new Experiments(
      mockedConfig,
      ({ experimentListCurrent: jest.fn() } as unknown) as CliReader,
      {
        '/my/dvc/root': ({
          showWebview: mockedShowWebview,
          getDvcRoot: () => mockedDvcRoot
        } as unknown) as ExperimentsTable,
        '/my/fun/dvc/root': ({
          showWebview: jest.fn(),
          getDvcRoot: () => '/my/fun/dvc/root'
        } as unknown) as ExperimentsTable
      }
    )

    const mockedExpFunc = jest.fn()
    await getExperimentNameThenRun(experiments, mockedExpFunc)

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).toBeCalledTimes(1)
    expect(mockedPickExperimentName).toBeCalledTimes(1)
    expect(mockedExpFunc).toBeCalledTimes(1)
    expect(mockedExpFunc).toBeCalledWith(
      {
        cliPath,
        pythonBinPath: undefined,
        cwd: mockedDvcRoot
      },
      'exp-123'
    )
  })

  it('should not call the function if a project is not picked', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(undefined)
    mockedQuickPickOne.mockResolvedValueOnce(undefined)

    const experiments = new Experiments(mockedConfig, {} as CliReader, {
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
    await getExperimentNameThenRun(experiments, mockedExpFunc)

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).toBeCalledTimes(1)
    expect(mockedGetExecutionOptions).not.toBeCalled()
    expect(mockedExpFunc).not.toBeCalled()
  })
})
