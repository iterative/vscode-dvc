import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { Experiment, Experiments } from '..'
import { Runner } from '../../cli/Runner'
import { Config } from '../../Config'
import { getDvcRoot } from '../../fileSystem/workspace'
import { getExperimentsThenRun } from './register'
import { runQueued, runReset } from './runner'

const mockedGetDvcRoot = mocked(getDvcRoot)
const mockedShowWebview = jest.fn()
const mockedDisposable = mocked(Disposable)
const mockedRun = jest.fn()
const mockedDvcRoot = '/my/dvc/root'
const mockedConfig = {} as Config

jest.mock('@hediet/std/disposable')
jest.mock('../../fileSystem/workspace')

beforeEach(() => {
  jest.resetAllMocks()

  mockedDisposable.fn.mockReturnValueOnce(({
    track: function<T>(disposable: T): T {
      return disposable
    }
  } as unknown) as (() => void) & Disposer)
})

describe('getExperimentsThenRun', () => {
  it('should call the runner with the correct args when runQueued is provided', async () => {
    mockedGetDvcRoot.mockResolvedValueOnce(mockedDvcRoot)

    const experiments = new Experiments(mockedConfig, {
      '/my/dvc/root': ({
        showWebview: mockedShowWebview,
        getDvcRoot: () => mockedDvcRoot
      } as unknown) as Experiment
    })

    await getExperimentsThenRun(
      {} as Config,
      experiments,
      ({
        run: mockedRun,
        onDidCompleteProcess: jest.fn()
      } as unknown) as Runner,
      runQueued
    )

    expect(mockedShowWebview).toBeCalledTimes(1)
    expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run', '--run-all')
  })
  it('should call the runner with the correct args when runReset is provided', async () => {
    mockedGetDvcRoot.mockResolvedValueOnce('/my/dvc/root')

    const experiments = new Experiments(mockedConfig, {
      '/my/dvc/root': ({
        showWebview: mockedShowWebview,
        getDvcRoot: () => mockedDvcRoot
      } as unknown) as Experiment,
      '/my/other/dvc/root': ({
        showWebview: mockedShowWebview,
        getDvcRoot: () => '/my/other/dvc/root'
      } as unknown) as Experiment
    })

    await getExperimentsThenRun(
      {} as Config,
      experiments,
      ({
        run: mockedRun,
        onDidCompleteProcess: jest.fn()
      } as unknown) as Runner,
      runReset
    )

    expect(mockedShowWebview).toBeCalledTimes(1)
    expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run', '--reset')
  })
})
