import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import debounce from 'lodash.debounce'
import { FSWatcher, watch } from 'chokidar'
import { TrackedExplorerTree } from './views/trackedExplorerTree'
import {
  getRepositoryWatcher,
  ignoredDotDirectories,
  onDidChangeFileSystem,
  onReady
} from './watcher'
import { Repository } from '../repository'

jest.mock('chokidar')
jest.mock('lodash.debounce')

const mockedWatch = mocked(watch)
const mockedDebounce = mocked(debounce)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('getRepositoryWatcher', () => {
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
    const watcher = getRepositoryWatcher(repository, trackedExplorerTree)

    watcher('')

    expect(mockedResetState).not.toBeCalled()
    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
    expect(mockedReset).not.toBeCalled()
  })

  it('should return a function that calls reset if it called with a .dvc data placeholder', () => {
    const watcher = getRepositoryWatcher(repository, trackedExplorerTree)

    watcher(join('some', 'dvc', 'repo', 'data', 'placeholder.dvc'))

    expect(mockedResetState).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)

    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
  })

  it('should return a function that calls reset if it called with a dvc.yml', () => {
    const watcher = getRepositoryWatcher(repository, trackedExplorerTree)

    watcher(join('some', 'dvc', 'repo', 'data', 'dvc.yaml'))

    expect(mockedResetState).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)

    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
  })

  it('should return a function that calls reset if it called with a dvc.lock', () => {
    const watcher = getRepositoryWatcher(repository, trackedExplorerTree)

    watcher(join('some', 'dvc', 'repo', 'data', 'dvc.lock'))

    expect(mockedResetState).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)

    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
  })

  it('should return a function that calls update if it called with anything else', () => {
    const watcher = getRepositoryWatcher(repository, trackedExplorerTree)

    watcher(__filename)

    expect(mockedResetState).not.toBeCalled()
    expect(mockedReset).not.toBeCalled()

    expect(mockedUpdateState).toBeCalledTimes(1)
    expect(mockedRefresh).toBeCalledTimes(1)
  })
})

describe('ignoredDotDirectories', () => {
  it('should match all paths under .dvc directories', () => {
    expect(
      ignoredDotDirectories.test('/Users/robot/vscode-dvc/demo/.dvc/tmp')
    ).toBe(true)
    expect(ignoredDotDirectories.test('C:\\vscode-dvc\\demo\\.dvc\\tmp')).toBe(
      true
    )
  })

  it('should match all paths under .env directories', () => {
    expect(
      ignoredDotDirectories.test('/Users/robot/vscode-dvc/demo/.env/bin')
    ).toBe(true)
    expect(ignoredDotDirectories.test('C:\\vscode-dvc\\demo\\.env\\bin')).toBe(
      true
    )
  })

  it('should match all paths under .venv directories', () => {
    expect(
      ignoredDotDirectories.test(
        '/Users/robot/vscode-dvc/demo/.venv/bin/python'
      )
    ).toBe(true)
    expect(
      ignoredDotDirectories.test('C:\\vscode-dvc\\demo\\.venv\\bin\\python')
    ).toBe(true)
  })

  it('should not match dot files', () => {
    expect(
      ignoredDotDirectories.test('/Users/robot/vscode-dvc/demo/.gitignore')
    ).toBe(false)
    expect(ignoredDotDirectories.test('C:\\vscode-dvc\\demo\\.gitignore')).toBe(
      false
    )
  })

  it('should not match normal directories', () => {
    expect(
      ignoredDotDirectories.test('/Users/robot/vscode-dvc/demo/data/MNIST')
    ).toBe(false)
    expect(
      ignoredDotDirectories.test('C:\\vscode-dvc\\demo\\data\\MNIST')
    ).toBe(false)
  })

  it('should not match normal files', () => {
    expect(
      ignoredDotDirectories.test('/Users/robot/vscode-dvc/demo/train.py')
    ).toBe(false)
    expect(ignoredDotDirectories.test('C:\\vscode-dvc\\demo\\train.py')).toBe(
      false
    )
  })
})

describe('onReady', () => {
  it('should add the callbacks after the scan is complete', () => {
    const mockedPath = join('some', 'path')
    const mockedDebounce = jest.fn()
    const mockedWatcher = mocked(new FSWatcher())
    onReady(mockedDebounce, join('some', 'path'), mockedWatcher)

    expect(mockedDebounce).toBeCalledWith(mockedPath)
    expect(mockedWatcher.on).toBeCalledWith('addDir', mockedDebounce)
    expect(mockedWatcher.on).toBeCalledWith('change', mockedDebounce)
    expect(mockedWatcher.on).toBeCalledWith('unlink', mockedDebounce)
    expect(mockedWatcher.on).toBeCalledWith('unlinkDir', mockedDebounce)
  })

  it('should work with multiple paths', () => {
    const mockedPath = join('some', 'path')
    const mockedOtherPath = join('some', 'other', 'path')
    const mockedDebounce = jest.fn()
    const mockedWatcher = mocked(new FSWatcher())
    onReady(mockedDebounce, [mockedPath, mockedOtherPath], mockedWatcher)

    expect(mockedDebounce).toBeCalledWith(mockedPath)
    expect(mockedWatcher.on).toBeCalledWith('addDir', mockedDebounce)
    expect(mockedWatcher.on).toBeCalledWith('change', mockedDebounce)
    expect(mockedWatcher.on).toBeCalledWith('unlink', mockedDebounce)
    expect(mockedWatcher.on).toBeCalledWith('unlinkDir', mockedDebounce)
  })
})

describe('onDidChangeFileSystem', () => {
  it('should call fs.watch with the correct parameters', () => {
    const file = '/some/file.csv'
    const func = () => undefined

    const mockedWatcher = mocked(new FSWatcher())
    mockedWatch.mockReturnValueOnce(mockedWatcher)

    mockedDebounce.mockImplementationOnce(
      (func: (...args: string[]) => void) =>
        func as {
          (...args: string[]): void
          cancel(): void
          flush(): void
        }
    )

    const { dispose } = onDidChangeFileSystem(file, func)

    expect(dispose).toBeDefined()

    expect(mockedDebounce).toBeCalledTimes(1)
    expect(mockedDebounce).toBeCalledWith(func, 500, {
      leading: true,
      trailing: false
    })

    expect(mockedWatch).toBeCalledWith(file, {
      ignored: ignoredDotDirectories
    })
    expect(mockedWatch).toBeCalledTimes(1)

    expect(mockedWatcher.on).toBeCalledTimes(1)
  })
})
