import { EventEmitter } from 'vscode'
import { Experiments } from '../../../experiments'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Process } from '../../../processExecution'

export const getMockedProcess = (stdout: string): Process =>
  ({
    all: { on: jest.fn() },
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
  const mockedColumnsChanged = buildMockedEventEmitter()
  const mockedColumnsOrderOrStatusChanged = buildMockedEventEmitter()
  const mockedExperimentsChanged = buildMockedEventEmitter()
  const mockedGetChildColumns = jest.fn()
  const mockedGetDvcRoots = jest.fn()
  const mockedGetWorkspaceAndCommits = jest.fn()
  const mockedGetCheckpoints = jest.fn()
  const mockedGetFilters = jest.fn()
  const mockedGetFilter = jest.fn()
  const mockedGetSorts = jest.fn()
  const mockedGetSelectedRevisions = jest.fn()
  const mockedGetCommitExperiments = jest.fn()
  const mockedGetFirstThreeColumnOrder = jest.fn()
  const mockedExperiments = {
    columnsChanged: mockedColumnsChanged,
    experimentsChanged: mockedExperimentsChanged,
    getDvcRoots: mockedGetDvcRoots,
    getRepository: () =>
      ({
        getCheckpoints: mockedGetCheckpoints,
        getChildColumns: mockedGetChildColumns,
        getCommitExperiments: mockedGetCommitExperiments,
        getFilter: mockedGetFilter,
        getFilters: mockedGetFilters,
        getFirstThreeColumnOrder: mockedGetFirstThreeColumnOrder,
        getSelectedRevisions: mockedGetSelectedRevisions,
        getSorts: mockedGetSorts,
        getWorkspaceAndCommits: mockedGetWorkspaceAndCommits
      } as unknown as Experiments),
    isReady: () => true
  } as unknown as WorkspaceExperiments

  return {
    mockedColumnsChanged,
    mockedColumnsOrderOrStatusChanged,
    mockedExperiments,
    mockedExperimentsChanged,
    mockedGetCheckpoints,
    mockedGetChildColumns,
    mockedGetCommitExperiments,
    mockedGetDvcRoots,
    mockedGetFilter,
    mockedGetFilters,
    mockedGetFirstThreeColumnOrder,
    mockedGetSelectedRevisions,
    mockedGetSorts,
    mockedGetWorkspaceAndCommits
  }
}

export const flushPromises = () => new Promise(process.nextTick)
