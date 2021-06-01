import { join } from 'path'
import { TrackedExplorerTree } from './views/trackedExplorerTree'
import { getWatcher } from './watcher'
import { Repository } from '../repository'

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getWatcher', () => {
  const mockedResetState = jest.fn()
  const mockedUpdateState = jest.fn()
  const repository = ({
    resetState: mockedResetState,
    updateState: mockedUpdateState
  } as unknown) as Repository

  const mockedRefresh = jest.fn()
  const mockedReset = jest.fn()
  const trackedExplorerTree = ({
    refresh: mockedRefresh,
    reset: mockedReset
  } as unknown) as TrackedExplorerTree

  it('should return a function that does nothing if an empty path is provided', () => {
    const watcher = getWatcher(repository, trackedExplorerTree)

    watcher('')

    expect(mockedResetState).not.toBeCalled()
    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
    expect(mockedReset).not.toBeCalled()
  })

  it('should return a function that calls reset if it called with a .dvc data placeholder', () => {
    const watcher = getWatcher(repository, trackedExplorerTree)

    watcher(join('some', 'dvc', 'repo', 'data', 'placeholder.dvc'))

    expect(mockedResetState).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)

    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
  })

  it('should return a function that calls reset if it called with a dvc.yml', () => {
    const watcher = getWatcher(repository, trackedExplorerTree)

    watcher(join('some', 'dvc', 'repo', 'data', 'dvc.yaml'))

    expect(mockedResetState).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)

    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
  })

  it('should return a function that calls reset if it called with a dvc.lock', () => {
    const watcher = getWatcher(repository, trackedExplorerTree)

    watcher(join('some', 'dvc', 'repo', 'data', 'dvc.lock'))

    expect(mockedResetState).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)

    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
  })

  it('should return a function that calls update if it called with anything else', () => {
    const watcher = getWatcher(repository, trackedExplorerTree)

    watcher(__filename)

    expect(mockedResetState).not.toBeCalled()
    expect(mockedReset).not.toBeCalled()

    expect(mockedUpdateState).toBeCalledTimes(1)
    expect(mockedRefresh).toBeCalledTimes(1)
  })
})
