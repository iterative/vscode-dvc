import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { workspace } from 'vscode'
import { FSWatcher, watch } from 'chokidar'
import { TrackedExplorerTree } from './tree'
import {
  getRepositoryListener,
  ignoredDotDirectories,
  createFileSystemWatcher,
  createNecessaryFileSystemWatcher
} from './watcher'
import { Repository } from '../repository'
import { EXPERIMENTS_GIT_REFS } from '../experiments/repository'

jest.mock('vscode')
jest.mock('chokidar')

const mockedWorkspace = mocked(workspace)
const mockedCreateFileSystemWatcher = jest.fn()
mockedWorkspace.createFileSystemWatcher = mockedCreateFileSystemWatcher

const mockedWatch = mocked(watch)
const mockedWatcher = mocked(new FSWatcher())
const mockedWatcherOn = jest.fn()
const mockedWatcherClose = jest.fn()
mockedWatcher.on = mockedWatcherOn
mockedWatcher.close = mockedWatcherClose

beforeEach(() => {
  jest.resetAllMocks()

  mockedCreateFileSystemWatcher.mockImplementationOnce(function () {
    return {
      onDidChange: jest.fn(),
      onDidCreate: jest.fn(),
      onDidDelete: jest.fn()
    }
  })
})

describe('getRepositoryListener', () => {
  const mockedResetState = jest.fn()
  const mockedUpdateState = jest.fn()
  const repository = {
    reset: mockedResetState,
    update: mockedUpdateState
  } as unknown as Repository

  const mockedRefresh = jest.fn()
  const mockedReset = jest.fn()
  const trackedExplorerTree = {
    refresh: mockedRefresh,
    reset: mockedReset
  } as unknown as TrackedExplorerTree

  it('should return a function that does nothing if an empty path is provided', () => {
    const listener = getRepositoryListener(repository, trackedExplorerTree)

    listener('')

    expect(mockedResetState).not.toBeCalled()
    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
    expect(mockedReset).not.toBeCalled()
  })

  it('should return a function that does nothing if an experiments git refs path is provided', () => {
    const listener = getRepositoryListener(repository, trackedExplorerTree)

    listener(join(__dirname, '.git', 'refs', 'exps', '0F'))

    expect(mockedResetState).not.toBeCalled()
    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
    expect(mockedReset).not.toBeCalled()
  })

  it('should return a function that calls reset if it is called with a .dvc data placeholder', () => {
    const listener = getRepositoryListener(repository, trackedExplorerTree)

    listener(join('some', 'dvc', 'repo', 'data', 'placeholder.dvc'))

    expect(mockedResetState).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)

    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
  })

  it('should return a function that calls reset if it is called with a dvc.yml', () => {
    const listener = getRepositoryListener(repository, trackedExplorerTree)

    listener(join('some', 'dvc', 'repo', 'data', 'dvc.yaml'))

    expect(mockedResetState).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)

    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
  })

  it('should return a function that calls reset if it is called with a dvc.lock', () => {
    const listener = getRepositoryListener(repository, trackedExplorerTree)

    listener(join('some', 'dvc', 'repo', 'data', 'dvc.lock'))

    expect(mockedResetState).toBeCalledTimes(1)
    expect(mockedReset).toBeCalledTimes(1)

    expect(mockedUpdateState).not.toBeCalled()
    expect(mockedRefresh).not.toBeCalled()
  })

  it('should return a function that calls update if it is called with anything else', () => {
    const listener = getRepositoryListener(repository, trackedExplorerTree)

    listener(__filename)

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

  it('should not match .dvc files', () => {
    expect(
      ignoredDotDirectories.test('/Users/robot/example-get-started/.vscode.dvc')
    ).toBe(false)
    expect(
      ignoredDotDirectories.test('C:\\example-get-started\\.vscode.dvc')
    ).toBe(false)
  })
})

describe('createFileSystemWatcher', () => {
  it('should call createFileSystemWatcher with the correct parameters', () => {
    const file = '/some/file.csv'
    const func = () => undefined

    createFileSystemWatcher(file, func)

    expect(mockedCreateFileSystemWatcher).toBeCalledWith(file)
  })
})

describe('createNecessaryFileSystemWatcher', () => {
  const mockedExternalGitRefs = join(
    __dirname,
    '..',
    '..',
    '..',
    EXPERIMENTS_GIT_REFS
  )

  it("should call chokidar's watch with the correct options when the path to watch is outside the workspace", () => {
    mockedWatch.mockReturnValue(mockedWatcher)

    const mockedListener = jest.fn()

    createNecessaryFileSystemWatcher(mockedExternalGitRefs, mockedListener)

    expect(mockedWatch).toBeCalledTimes(1)
    expect(mockedWatch).toBeCalledWith(mockedExternalGitRefs, {
      ignoreInitial: true
    })

    expect(mockedWatcherOn).toBeCalledTimes(1)
    expect(mockedWatcherOn).toBeCalledWith('all', mockedListener)
  })

  it('should return a dispose function that removes the listener when the path to watch is outside the workspace', () => {
    mockedWatch.mockReturnValue(mockedWatcher)

    const mockedListener = jest.fn()

    const { dispose } = createNecessaryFileSystemWatcher(
      mockedExternalGitRefs,
      mockedListener
    )

    expect(mockedWatcherClose).not.toBeCalled()

    dispose()

    expect(mockedWatcherClose).toBeCalledTimes(1)
  })
})
