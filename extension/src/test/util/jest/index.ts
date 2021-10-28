import { mocked } from 'ts-jest/utils'
import { EventEmitter } from 'vscode'
import { Experiments } from '../../../experiments'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Process } from '../../../processExecution'

export const getMockedProcess = (stdout: string): Process =>
  ({
    on: jest.fn(),
    stdout: new Promise(resolve => resolve(stdout))
  } as unknown as Process)

export const getFailingMockedProcess = (stderr: string): Process =>
  ({
    on: jest.fn(),
    // eslint-disable-next-line promise/param-names
    stdout: new Promise((_, reject) => reject(new Error(stderr)))
  } as unknown as Process)

const buildMockedEventEmitter = () => {
  const mockedEmitter = mocked(new EventEmitter<void>())
  const mockedEmitterChangedFire = jest.fn()
  const mockedEmitterChangedEvent = jest.fn()
  mockedEmitter.fire = mockedEmitterChangedFire
  mockedEmitter.event = mockedEmitterChangedEvent
  return mockedEmitter
}

export const buildMockedExperiments = () => {
  const mockedParamsOrMetricsChanged = buildMockedEventEmitter()
  const mockedExperimentsChanged = buildMockedEventEmitter()
  const mockedGetChildParamsOrMetrics = jest.fn()
  const mockedGetDvcRoots = jest.fn()
  const mockedGetExperiments = jest.fn()
  const mockedGetCheckpoints = jest.fn()
  const mockedGetFilters = jest.fn()
  const mockedGetFilter = jest.fn()
  const mockedGetSorts = jest.fn()
  const mockedExperiments = {
    experimentsChanged: mockedExperimentsChanged,
    getDvcRoots: mockedGetDvcRoots,
    getRepository: () =>
      ({
        getCheckpoints: mockedGetCheckpoints,
        getChildParamsOrMetrics: mockedGetChildParamsOrMetrics,
        getExperiments: mockedGetExperiments,
        getFilter: mockedGetFilter,
        getFilters: mockedGetFilters,
        getSorts: mockedGetSorts
      } as unknown as Experiments),
    isReady: () => true,
    paramsOrMetricsChanged: mockedParamsOrMetricsChanged
  } as unknown as WorkspaceExperiments

  return {
    mockedExperiments,
    mockedExperimentsChanged,
    mockedGetCheckpoints,
    mockedGetChildParamsOrMetrics,
    mockedGetDvcRoots,
    mockedGetExperiments,
    mockedGetFilter,
    mockedGetFilters,
    mockedGetSorts,
    mockedParamsOrMetricsChanged
  }
}
