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

export const buildMockedEventEmitter = <T = void>() => {
  const mockedEmitter = jest.mocked(new EventEmitter<T>())
  const mockedEmitterChangedFire = jest.fn()
  const mockedEmitterChangedEvent = jest.fn()
  mockedEmitter.fire = mockedEmitterChangedFire
  mockedEmitter.event = mockedEmitterChangedEvent
  return mockedEmitter
}

export const buildMockedExperiments = () => {
  const mockedMetricsOrParamsChanged = buildMockedEventEmitter()
  const mockedExperimentsChanged = buildMockedEventEmitter()
  const mockedGetChildMetricsOrParams = jest.fn()
  const mockedGetDvcRoots = jest.fn()
  const mockedGetExperiments = jest.fn()
  const mockedGetCheckpoints = jest.fn()
  const mockedGetFilters = jest.fn()
  const mockedGetFilter = jest.fn()
  const mockedGetSorts = jest.fn()
  const mockedGetSelectedRevisions = jest.fn()
  const mockedExperiments = {
    experimentsChanged: mockedExperimentsChanged,
    getDvcRoots: mockedGetDvcRoots,
    getRepository: () =>
      ({
        getCheckpoints: mockedGetCheckpoints,
        getChildMetricsOrParams: mockedGetChildMetricsOrParams,
        getExperiments: mockedGetExperiments,
        getFilter: mockedGetFilter,
        getFilters: mockedGetFilters,
        getSelectedRevisions: mockedGetSelectedRevisions,
        getSorts: mockedGetSorts
      } as unknown as Experiments),
    isReady: () => true,
    metricsOrParamsChanged: mockedMetricsOrParamsChanged
  } as unknown as WorkspaceExperiments

  return {
    mockedExperiments,
    mockedExperimentsChanged,
    mockedGetCheckpoints,
    mockedGetChildMetricsOrParams,
    mockedGetDvcRoots,
    mockedGetExperiments,
    mockedGetFilter,
    mockedGetFilters,
    mockedGetSelectedRevisions,
    mockedGetSorts,
    mockedMetricsOrParamsChanged
  }
}
