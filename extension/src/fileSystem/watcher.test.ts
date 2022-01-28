import { join } from 'path'
import { workspace } from 'vscode'
import { FSWatcher, watch } from 'chokidar'
import {
  ignoredDotDirectories,
  createFileSystemWatcher,
  createNecessaryFileSystemWatcher
} from './watcher'
import { getWorkspaceFolders } from '../vscode/workspaceFolders'

jest.mock('vscode')
jest.mock('chokidar')
jest.mock('../vscode/workspaceFolders')

const mockedWorkspace = jest.mocked(workspace)
const mockedCreateFileSystemWatcher = jest.fn()
mockedWorkspace.createFileSystemWatcher = mockedCreateFileSystemWatcher

const mockedGetWorkspaceFolders = jest.mocked(getWorkspaceFolders)

const mockedWatch = jest.mocked(watch)
const mockedWatcher = jest.mocked(new FSWatcher())
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
  const cwd = join(__dirname, '..', '..', '..')
  const mockedExternalGitRefs = join('.git', 'refs')
  const mockedExternalGitIndex = join('.git', 'index')

  it('should create a chokidar watcher with the correct options when the path to watch is outside the workspace', () => {
    mockedGetWorkspaceFolders.mockReturnValueOnce([__dirname])

    mockedWatch.mockReturnValue(mockedWatcher)

    const mockedListener = jest.fn()

    createNecessaryFileSystemWatcher(
      cwd,
      [mockedExternalGitRefs, mockedExternalGitIndex],
      mockedListener
    )

    expect(mockedWatch).toBeCalledTimes(1)
    expect(mockedWatch).toBeCalledWith(
      [join(cwd, mockedExternalGitRefs), join(cwd, mockedExternalGitIndex)],
      {
        ignoreInitial: true,
        ignored: ignoredDotDirectories
      }
    )

    expect(mockedWatcherOn).toBeCalledTimes(1)
    expect(mockedCreateFileSystemWatcher).not.toBeCalled()
  })

  it('should return a dispose function that removes the listener when the path to watch is outside the workspace', () => {
    mockedGetWorkspaceFolders.mockReturnValueOnce([__dirname])

    mockedWatch.mockReturnValue(mockedWatcher)

    const mockedListener = jest.fn()

    const { dispose } = createNecessaryFileSystemWatcher(
      cwd,
      [mockedExternalGitRefs],
      mockedListener
    )

    expect(mockedWatcherClose).not.toBeCalled()

    dispose()

    expect(mockedWatcherClose).toBeCalledTimes(1)
    expect(mockedCreateFileSystemWatcher).not.toBeCalled()
  })

  it('should create an instance of the chokidar watcher only if the path is outside of all the available workspace folders', () => {
    mockedGetWorkspaceFolders.mockReturnValueOnce([
      join(__dirname, 'first'),
      join(__dirname, 'second'),
      join(__dirname, 'third'),
      join(__dirname, 'fourth'),
      join(__dirname, 'fifth')
    ])

    mockedWatch.mockReturnValue(mockedWatcher)

    const mockedListener = jest.fn()

    createNecessaryFileSystemWatcher(
      cwd,
      [mockedExternalGitRefs],
      mockedListener
    )

    expect(mockedWatch).toBeCalledTimes(1)
    expect(mockedCreateFileSystemWatcher).not.toBeCalled()
  })

  it("should create an instance of VS Code's watcher whenever the path is inside any of the workspace folders", () => {
    const mockedSecondDir = join(__dirname, 'second')
    mockedGetWorkspaceFolders.mockReturnValueOnce([
      join(__dirname, 'first'),
      mockedSecondDir
    ])

    mockedWatch.mockReturnValue(mockedWatcher)

    const mockedListener = jest.fn()

    const mockedInternalGitRefs = join('.git', 'refs')

    createNecessaryFileSystemWatcher(
      mockedSecondDir,
      [mockedInternalGitRefs],
      mockedListener
    )

    expect(mockedWatch).not.toBeCalled()
    expect(mockedCreateFileSystemWatcher).toBeCalledTimes(1)
  })

  it("should create an instance of VS Code's watcher whenever the path is inside the only workspace folder", () => {
    const mockedRoot = __dirname
    mockedGetWorkspaceFolders.mockReturnValueOnce([mockedRoot])

    mockedWatch.mockReturnValue(mockedWatcher)

    const mockedListener = jest.fn()

    const mockedInternalGitRefs = join('.git', 'refs')

    createNecessaryFileSystemWatcher(
      mockedRoot,
      [mockedInternalGitRefs],
      mockedListener
    )

    expect(mockedWatch).not.toBeCalled()
    expect(mockedCreateFileSystemWatcher).toBeCalledTimes(1)
    expect(mockedCreateFileSystemWatcher).toBeCalledWith(join(mockedRoot, '**'))
  })
})
