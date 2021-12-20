import { join, resolve } from 'path'
import { mocked } from 'ts-jest/utils'
import { workspace } from 'vscode'
import { FSWatcher } from 'chokidar'
import {
  getRepositoryListener,
  ignoredDotDirectories,
  createFileSystemWatcher
} from './watcher'
import { Repository } from '../repository'

jest.mock('vscode')
jest.mock('chokidar')
jest.mock('../vscode/workspaceFolders')

const mockedWorkspace = mocked(workspace)
const mockedCreateFileSystemWatcher = jest.fn()
mockedWorkspace.createFileSystemWatcher = mockedCreateFileSystemWatcher

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
  const mockedUpdate = jest.fn()
  const repository = {
    update: mockedUpdate
  } as unknown as Repository

  it('should return a function that does nothing if an empty path is provided', () => {
    const mockedDvcRoot = resolve('some', 'dvc', 'root')
    const listener = getRepositoryListener(repository, mockedDvcRoot)

    listener('')

    expect(mockedUpdate).not.toBeCalled()
  })

  it('should return a function that does nothing if an experiments git refs path is provided', () => {
    const mockedDvcRoot = __dirname
    const listener = getRepositoryListener(repository, mockedDvcRoot)

    listener(join(mockedDvcRoot, '.git', 'refs', 'exps', '0F'))

    expect(mockedUpdate).not.toBeCalled()
  })

  it('should return a function that calls update with the provided path if it is inside the repo', () => {
    const mockedDvcRoot = resolve('some', 'dvc', 'repo')
    const listener = getRepositoryListener(repository, mockedDvcRoot)

    const path = join(mockedDvcRoot, 'data', 'placeholder.dvc')

    listener(join(mockedDvcRoot, 'data', 'placeholder.dvc'))

    expect(mockedUpdate).toBeCalledTimes(1)
    expect(mockedUpdate).toBeCalledWith(path)
  })

  it('should return a function that calls update if it is called with .git/index (that is above the dvc root)', () => {
    const listener = getRepositoryListener(repository, __dirname)

    const path = resolve(__dirname, '..', '..', '.git', 'index')
    listener(path)

    expect(mockedUpdate).toBeCalledTimes(1)
    expect(mockedUpdate).toBeCalledWith(path)
  })

  it('should return a function that calls update if it is called with .git/ORIG_HEAD (that is above the dvc root)', () => {
    const listener = getRepositoryListener(repository, __dirname)

    const path = resolve(__dirname, '..', '..', '.git', 'ORIG_HEAD')
    listener(path)

    expect(mockedUpdate).toBeCalledTimes(1)
    expect(mockedUpdate).toBeCalledWith(path)
  })

  it('should return a function that does not call update if it is called with a file in the .git folder that does not contain index or HEAD', () => {
    const listener = getRepositoryListener(repository, __dirname)

    listener(
      resolve(
        __dirname,
        '..',
        '..',
        '.git',
        'any',
        'other',
        'file',
        'or',
        'ref'
      )
    )

    expect(mockedUpdate).not.toBeCalled()
  })

  it('should return a function that returns early if called with a path that is above the dvc root that is not in the .git folder', () => {
    const listener = getRepositoryListener(repository, __dirname)

    listener(resolve(__dirname, '..', '..', 'other', 'refs'))

    expect(mockedUpdate).not.toBeCalled()
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
