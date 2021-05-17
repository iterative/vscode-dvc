import { Disposable, Disposer } from '@hediet/std/disposable'
import { mocked } from 'ts-jest/utils'
import { ExperimentsTable, Experiments } from '..'
import { Runner } from '../../cli/Runner'
import { Config } from '../../Config'
import { getDvcRoot } from '../../fileSystem/workspace'
import { showExperimentsTableThenRun } from './register'
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

describe('showExperimentsTableThenRun', () => {
  it('should call the runner with the correct args when runQueued is provided', async () => {
    mockedGetDvcRoot.mockResolvedValueOnce(mockedDvcRoot)

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

    expect(mockedGetDvcRoot).toBeCalledTimes(1)
    expect(mockedShowWebview).toBeCalledTimes(1)
    expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run', '--run-all')
  })

  it('should call the runner with the correct args when runReset is provided', async () => {
    mockedGetDvcRoot.mockResolvedValueOnce('/my/dvc/root')

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

    expect(mockedGetDvcRoot).toBeCalledTimes(1)
    expect(mockedShowWebview).toBeCalledTimes(1)
    expect(mockedRun).toBeCalledWith(mockedDvcRoot, 'exp', 'run', '--reset')
  })
})
