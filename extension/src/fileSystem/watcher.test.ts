import { join } from 'path'
import { mocked } from 'ts-jest/utils'
import { Uri, workspace, WorkspaceFolder } from 'vscode'
import { FSWatcher, watch } from 'chokidar'
import { TrackedExplorerTree } from './tree'
import {
  getRepositoryListener,
  ignoredDotDirectories,
  createFileSystemWatcher,
  createNecessaryFileSystemWatcher
} from './watcher'
import { Repository } from '../repository'
import { getWorkspaceFolders } from '../vscode/workspace'

jest.mock('vscode')
jest.mock('chokidar')
jest.mock('../vscode/workspace')

const mockedWorkspace = mocked(workspace)
const mockedCreateFileSystemWatcher = jest.fn()
mockedWorkspace.createFileSystemWatcher = mockedCreateFileSystemWatcher

const mockedGetWorkspaceFolders = mocked(getWorkspaceFolders)

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
  const mockedListener = jest.fn()
  it('should call createFileSystemWatcher with the correct parameters', () => {
    const file = '/some/file.csv'

    createFileSystemWatcher(file, mockedListener)

    expect(mockedCreateFileSystemWatcher).toBeCalledWith(file)
  })

  it('should throw an error when given a directory path', () => {
    expect(() => createFileSystemWatcher(__dirname, mockedListener)).toThrow()
  })

  it('should not throw an error when given a directory glob', () => {
    expect(() =>
      createFileSystemWatcher(join(__dirname, '**'), mockedListener)
    ).not.toThrow()
  })
})

describe('createNecessaryFileSystemWatcher', () => {
  const mockedExternalGitRefs = join(
    __dirname,
    '..',
    '..',
    '..',
    '.git',
    'refs',
    '**'
  )

  it('should create a chokidar watcher with the correct options when the path to watch is outside the workspace', () => {
    mockedGetWorkspaceFolders.mockReturnValueOnce([
      { uri: Uri.file(__dirname) } as WorkspaceFolder
    ])

    mockedWatch.mockReturnValue(mockedWatcher)

    const mockedListener = jest.fn()

    createNecessaryFileSystemWatcher(mockedExternalGitRefs, mockedListener)

    expect(mockedWatch).toBeCalledTimes(1)
    expect(mockedWatch).toBeCalledWith(mockedExternalGitRefs, {
      ignoreInitial: true
    })

    expect(mockedWatcherOn).toBeCalledTimes(1)
    expect(mockedCreateFileSystemWatcher).not.toBeCalled()
  })

  it('should return a dispose function that removes the listener when the path to watch is outside the workspace', () => {
    mockedGetWorkspaceFolders.mockReturnValueOnce([
      { uri: Uri.file(__dirname) } as WorkspaceFolder
    ])

    mockedWatch.mockReturnValue(mockedWatcher)

    const mockedListener = jest.fn()

    const { dispose } = createNecessaryFileSystemWatcher(
      mockedExternalGitRefs,
      mockedListener
    )

    expect(mockedWatcherClose).not.toBeCalled()

    dispose()

    expect(mockedWatcherClose).toBeCalledTimes(1)
    expect(mockedCreateFileSystemWatcher).not.toBeCalled()
  })

  it('should create an instance of the chokidar watcher only if the path is outside of all the available workspace folders', () => {
    mockedGetWorkspaceFolders.mockReturnValueOnce([
      { uri: Uri.file(join(__dirname, 'first')) },
      { uri: Uri.file(join(__dirname, 'second')) },
      { uri: Uri.file(join(__dirname, 'third')) },
      { uri: Uri.file(join(__dirname, 'fourth')) },
      { uri: Uri.file(join(__dirname, 'fifth')) }
    ] as WorkspaceFolder[])

    mockedWatch.mockReturnValue(mockedWatcher)

    const mockedListener = jest.fn()

    createNecessaryFileSystemWatcher(mockedExternalGitRefs, mockedListener)

    expect(mockedWatch).toBeCalledTimes(1)
    expect(mockedCreateFileSystemWatcher).not.toBeCalled()
  })

  it("should create an instance of VS Code's watcher whenever the path is inside any of the workspace folders", () => {
    const mockedSecondDir = join(__dirname, 'second')
    mockedGetWorkspaceFolders.mockReturnValueOnce([
      { uri: Uri.file(join(__dirname, 'first')) },
      { uri: Uri.file(mockedSecondDir) }
    ] as WorkspaceFolder[])

    mockedWatch.mockReturnValue(mockedWatcher)

    const mockedListener = jest.fn()

    const mockedInternalGitRefs = join(mockedSecondDir, '.git', 'refs', '**')

    createNecessaryFileSystemWatcher(mockedInternalGitRefs, mockedListener)

    expect(mockedWatch).not.toBeCalled()
    expect(mockedCreateFileSystemWatcher).toBeCalledTimes(1)
  })

  it("should create an instance of VS Code's watcher whenever the path is inside the only workspace folder", () => {
    const mockedRoot = __dirname
    mockedGetWorkspaceFolders.mockReturnValueOnce([
      { uri: Uri.file(mockedRoot) } as WorkspaceFolder
    ])

    mockedWatch.mockReturnValue(mockedWatcher)

    const mockedListener = jest.fn()

    const mockedInternalGitRefs = join(mockedRoot, '.git', 'refs', '**')

    createNecessaryFileSystemWatcher(mockedInternalGitRefs, mockedListener)

    expect(mockedWatch).not.toBeCalled()
    expect(mockedCreateFileSystemWatcher).toBeCalledTimes(1)
  })
})
