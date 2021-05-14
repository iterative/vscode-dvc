import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { Experiments } from '..'
import { Runner } from '../../cli/Runner'
import { Config } from '../../Config'
import { getDvcRoot } from '../../fileSystem/workspace'
import { getExperimentsThenRun } from './register'
import { run, runQueued, runReset } from './runner'

const mockedGetDvcRoot = mocked(getDvcRoot)
const mockedShowWebview = jest.fn()
const mockedDisposable = mocked(Disposable)
const mockedRun = jest.fn()
const mockedDvcRoot = '/my/dvc/root'

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
    const mockedDisposer = mockedDisposable.fn()
    mockedGetDvcRoot.mockResolvedValueOnce(mockedDvcRoot)

    await getExperimentsThenRun(
      {} as Config,
      {
        '/my/dvc/root': ({
          showWebview: mockedShowWebview,
          getDvcRoot: () => mockedDvcRoot
        } as unknown) as Experiments
      },
      undefined,
      ({
        run: mockedRun,
        onDidCompleteProcess: jest.fn()
      } as unknown) as Runner,
      mockedDisposer,
      runQueued
    )

    expect(mockedGetDvcRoot).toBeCalledTimes(1)
    expect(mockedShowWebview).toBeCalledTimes(1)
    expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run', '--run-all')
  })

  it('should call the runner with the correct args when runReset is provided', async () => {
    const mockedDisposer = mockedDisposable.fn()
    mockedGetDvcRoot.mockResolvedValueOnce('/my/dvc/root')

    await getExperimentsThenRun(
      {} as Config,
      {
        '/my/dvc/root': ({
          showWebview: mockedShowWebview,
          getDvcRoot: () => mockedDvcRoot
        } as unknown) as Experiments,
        '/my/other/dvc/root': ({
          showWebview: mockedShowWebview,
          getDvcRoot: () => '/my/other/dvc/root'
        } as unknown) as Experiments
      },
      undefined,
      ({
        run: mockedRun,
        onDidCompleteProcess: jest.fn()
      } as unknown) as Runner,
      mockedDisposer,
      runReset
    )

    expect(mockedGetDvcRoot).toBeCalledTimes(1)
    expect(mockedShowWebview).toBeCalledTimes(1)
    expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run', '--reset')
  })

  it('should call the runner with the correct args when run and a default project are provided', async () => {
    const mockedDisposer = mockedDisposable.fn()
    mockedGetDvcRoot.mockResolvedValueOnce(mockedDvcRoot)

    await getExperimentsThenRun(
      {} as Config,
      {
        '/my/dvc/root': ({
          showWebview: mockedShowWebview,
          getDvcRoot: () => mockedDvcRoot
        } as unknown) as Experiments
      },
      mockedDvcRoot,
      ({
        run: mockedRun,
        onDidCompleteProcess: jest.fn()
      } as unknown) as Runner,
      mockedDisposer,
      run
    )

    expect(mockedGetDvcRoot).not.toBeCalled()
    expect(mockedShowWebview).toBeCalledTimes(1)
    expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run')
  })
})
