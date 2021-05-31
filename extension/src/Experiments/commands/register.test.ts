import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { ExperimentsTable, Experiments } from '..'
import { CliRunner } from '../../cli/runner'
import { Config } from '../../Config'
import {
  getCwdThenRun,
  showExperimentsTableThenRun,
  getExpNameAndInputThenRun,
  getCwdAndQuickPickThenRun
} from './register'
import { runQueued, runReset } from './runner'
import { quickPickOne } from '../../vscode/quickPick'
import { CliReader } from '../../cli/reader'
import { pickExperimentName } from './quickPick'
import { getInput } from '../../vscode/inputBox'

const mockedShowWebview = jest.fn()
const mockedDisposable = mocked(Disposable)
const mockedRun = jest.fn()
const mockedDvcRoot = '/my/dvc/root'
const mockedGetDefaultProject = jest.fn()
const mockedQuickPickOne = mocked(quickPickOne)
const mockedPickExperimentName = mocked(pickExperimentName)
const mockedGetInput = mocked(getInput)
const mockedConfig = ({
  getDefaultProject: mockedGetDefaultProject
} as unknown) as Config

jest.mock('@hediet/std/disposable')
jest.mock('../../vscode/quickPick')
jest.mock('../../vscode/inputBox')
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

describe('getCwdThenRun', () => {
  it('should call the correct function with the correct parameters if a project is picked', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(undefined)
    mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

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
    await getCwdThenRun(experiments, mockedExpFunc)

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).toBeCalledTimes(1)
    expect(mockedExpFunc).toBeCalledTimes(1)
    expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot)
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
    await getCwdThenRun(experiments, mockedExpFunc)

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).toBeCalledTimes(1)
    expect(mockedExpFunc).not.toBeCalled()
  })
})

describe('getExpNameAndInputThenRun', () => {
  it('should call the correct function with the correct parameters if a project and experiment are picked and an input provided', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(undefined)
    mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)
    mockedPickExperimentName.mockResolvedValueOnce('exp-123')
    mockedGetInput.mockResolvedValueOnce('abc123')

    const experiments = new Experiments(
      mockedConfig,
      ({ experimentListCurrent: jest.fn() } as unknown) as CliReader,
      {
        '/my/dvc/root': ({
          showWebview: mockedShowWebview,
          getDvcRoot: () => mockedDvcRoot
        } as unknown) as ExperimentsTable,
        '/fun/dvc/root': ({
          showWebview: jest.fn(),
          getDvcRoot: () => '/fun/dvc/root'
        } as unknown) as ExperimentsTable
      }
    )

    const mockedExpFunc = jest.fn()
    await getExpNameAndInputThenRun(
      experiments,
      mockedExpFunc,
      'enter your password please'
    )

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).toBeCalledTimes(1)
    expect(mockedPickExperimentName).toBeCalledTimes(1)
    expect(mockedExpFunc).toBeCalledTimes(1)
    expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot, 'exp-123', 'abc123')
  })

  it('should not call the function or ask for input if a project is not picked', async () => {
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
    await getExpNameAndInputThenRun(
      experiments,
      mockedExpFunc,
      'please name the branch'
    )

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).toBeCalledTimes(1)
    expect(mockedGetInput).not.toBeCalled()
    expect(mockedExpFunc).not.toBeCalled()
  })

  it('should not call the function if user input is not provided', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(mockedDvcRoot)
    mockedPickExperimentName.mockResolvedValueOnce('exp-456')
    mockedQuickPickOne.mockResolvedValueOnce(undefined)
    mockedGetInput.mockResolvedValueOnce(undefined)

    const experiments = new Experiments(
      mockedConfig,
      ({ experimentListCurrent: jest.fn() } as unknown) as CliReader,
      {
        '/my/dvc/root': ({
          showWebview: mockedShowWebview,
          getDvcRoot: () => mockedDvcRoot
        } as unknown) as ExperimentsTable,
        '/dvc/root': ({
          showWebview: jest.fn(),
          getDvcRoot: () => '/dvc/root'
        } as unknown) as ExperimentsTable
      }
    )

    const mockedExpFunc = jest.fn()
    await getExpNameAndInputThenRun(
      experiments,
      mockedExpFunc,
      'please enter your bank account number and sort code'
    )

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).not.toBeCalled()
    expect(mockedGetInput).toBeCalledTimes(1)
    expect(mockedExpFunc).not.toBeCalled()
  })
})

describe('getCwdAndQuickPickThenRun', () => {
  it('should call the correct function with the correct parameters if a project and experiment are picked and the quick pick returns a list', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(undefined)
    mockedQuickPickOne.mockResolvedValueOnce(mockedDvcRoot)

    const experiments = new Experiments(mockedConfig, {} as CliReader, {
      '/my/dvc/root': ({
        showWebview: mockedShowWebview,
        getDvcRoot: () => mockedDvcRoot
      } as unknown) as ExperimentsTable,
      '/my/fun/dvc/root': ({
        showWebview: jest.fn(),
        getDvcRoot: () => '/my/fun/dvc/root'
      } as unknown) as ExperimentsTable
    })

    const mockedExpFunc = jest.fn()
    const mockedPickedOptions = ['a', 'b', 'c']
    const mockedQuickPick = jest.fn().mockResolvedValueOnce(mockedPickedOptions)
    await getCwdAndQuickPickThenRun<string[]>(
      experiments,
      mockedExpFunc,
      mockedQuickPick
    )

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).toBeCalledTimes(1)
    expect(mockedQuickPick).toBeCalledTimes(1)
    expect(mockedExpFunc).toBeCalledTimes(1)
    expect(mockedExpFunc).toBeCalledWith(mockedDvcRoot, mockedPickedOptions)
  })

  it('should not call the function or ask for quick picks if a project is not picked', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(undefined)
    mockedQuickPickOne.mockResolvedValueOnce(undefined)

    const experiments = new Experiments(mockedConfig, {} as CliReader, {
      '/my/dvc/root': ({
        showWebview: mockedShowWebview,
        getDvcRoot: () => mockedDvcRoot
      } as unknown) as ExperimentsTable,
      '/moi/dvc/root': ({
        showWebview: jest.fn(),
        getDvcRoot: () => '/moi/root'
      } as unknown) as ExperimentsTable
    })

    const mockedExpFunc = jest.fn()
    const mockedQuickPick = jest.fn()
    await getCwdAndQuickPickThenRun(experiments, mockedExpFunc, mockedQuickPick)

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).toBeCalledTimes(1)
    expect(mockedQuickPick).not.toBeCalled()
    expect(mockedExpFunc).not.toBeCalled()
  })

  it('should not call the function if quick picks are not provided', async () => {
    mockedGetDefaultProject.mockReturnValueOnce(mockedDvcRoot)
    mockedPickExperimentName.mockResolvedValueOnce('exp-789')

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
    const mockedQuickPick = jest.fn().mockResolvedValueOnce(undefined)
    await getCwdAndQuickPickThenRun(experiments, mockedExpFunc, mockedQuickPick)

    expect(mockedGetDefaultProject).toBeCalledTimes(1)
    expect(mockedQuickPickOne).not.toBeCalled()
    expect(mockedQuickPick).toBeCalledTimes(1)
    expect(mockedExpFunc).not.toBeCalled()
  })
})
