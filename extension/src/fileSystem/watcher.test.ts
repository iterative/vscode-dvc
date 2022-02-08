import { join } from 'path'
import { workspace } from 'vscode'
import { ignoredDotDirectories, createFileSystemWatcher } from './watcher'

jest.mock('vscode')
jest.mock('chokidar')
jest.mock('../vscode/workspaceFolders')

const mockedWorkspace = jest.mocked(workspace)
const mockedCreateFileSystemWatcher = jest.fn()
mockedWorkspace.createFileSystemWatcher = mockedCreateFileSystemWatcher

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
