import { FSWatcher, watch } from 'chokidar'
import { mocked } from 'ts-jest/utils'
import debounce from 'lodash.debounce'
import { join, resolve } from 'path'
import * as FileSystem from '.'
import { root } from '../cli/reader'
import { Disposable } from '../extension'

const {
  exists,
  findDvcRootPaths,
  getWatcher,
  ignoredDotDirectories,
  isDirectory,
  onDidChangeFileSystem,
  onDidChangeFileType
} = FileSystem

jest.mock('chokidar')
jest.mock('lodash.debounce')
jest.mock('../cli/reader')

const mockedWatch = mocked(watch)
const mockedDebounce = mocked(debounce)
const mockedRoot = mocked(root)

beforeEach(() => {
  jest.resetAllMocks()
})

const multiDemoRepoPath = resolve(__dirname, '..', '..', '..', 'demo')
const singleDemoRepoPath = resolve(multiDemoRepoPath, 'demo1')
const otherDemoRepoPath = resolve(multiDemoRepoPath, 'demo2')

describe('onDidChangeFileSystem', () => {
  it('should call fs.watch with the correct parameters', () => {
    const file = '/some/file.csv'
    const func = () => undefined

    const mockedWatcher = mocked(new FSWatcher())
    mockedWatch.mockReturnValueOnce(mockedWatcher)

    const getWatcherSpy = jest
      .spyOn(FileSystem, 'getWatcher')
      .mockImplementationOnce(e => e)

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

    expect(getWatcherSpy).toBeCalledTimes(1)

    expect(mockedDebounce).toBeCalledTimes(1)
    expect(mockedDebounce).toBeCalledWith(func, 500, {
      leading: true,
      trailing: false
    })

    expect(mockedWatch).toBeCalledWith(file, {
      ignored: ignoredDotDirectories
    })
    expect(mockedWatch).toBeCalledTimes(1)

    expect(mockedWatcher.on).toBeCalledTimes(6)
    expect(mockedWatcher.on).toBeCalledWith('ready', func)
    expect(mockedWatcher.on).toBeCalledWith('add', func)
    expect(mockedWatcher.on).toBeCalledWith('addDir', func)
    expect(mockedWatcher.on).toBeCalledWith('change', func)
    expect(mockedWatcher.on).toBeCalledWith('unlink', func)
    expect(mockedWatcher.on).toBeCalledWith('unlinkDir', func)
  })
})

describe('onDidChangeFileType', () => {
  it('should called onDidChangeFileSystem with the correct parameters', () => {
    const addSpy = jest
      .spyOn(FileSystem, 'onDidChangeFileSystem')
      .mockReturnValueOnce(Disposable.fn())

    const handler = () => {}

    onDidChangeFileType(
      singleDemoRepoPath,
      ['*.dvc', 'dvc.lock', 'dvc.yaml'],
      handler
    )
    expect(addSpy).toBeCalledTimes(1)
    expect(addSpy).toBeCalledWith(
      [
        join(singleDemoRepoPath, '**', '*.dvc'),
        join(singleDemoRepoPath, '**', 'dvc.lock'),
        join(singleDemoRepoPath, '**', 'dvc.yaml')
      ],
      handler
    )
  })
})

describe('getWatcher', () => {
  const mockHandler = jest.fn()
  const file = '/some/file/on/a/system.log'

  it('should return a new file watcher callback which calls the handler when a path is provided', () => {
    const watcher = getWatcher(mockHandler)

    watcher(file)

    expect(mockHandler).toBeCalledTimes(1)
  })

  it('should return a new file watcher callback which does not call the handler when a path is not provided', () => {
    const watcher = getWatcher(mockHandler)

    watcher('')

    expect(mockHandler).not.toBeCalled()
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

describe('findDvcRootPaths', () => {
  const dataRoot = resolve(singleDemoRepoPath, 'data')
  const mockCliPath = 'dvc'

  it('should find the dvc root if it exists in the given folder', async () => {
    const dvcRoots = await findDvcRootPaths({
      cliPath: mockCliPath,
      cwd: singleDemoRepoPath,
      pythonBinPath: undefined
    })

    expect(mockedRoot).not.toBeCalled()
    expect(dvcRoots).toEqual([singleDemoRepoPath])
  })

  it('should find multiple roots if available one directory below the given folder', async () => {
    const dvcRoots = await findDvcRootPaths({
      cliPath: mockCliPath,
      cwd: multiDemoRepoPath,
      pythonBinPath: undefined
    })

    expect(mockedRoot).not.toBeCalled()
    expect(dvcRoots).toEqual([singleDemoRepoPath, otherDemoRepoPath].sort())
  })

  it('should find the dvc root if it exists above the given folder', async () => {
    mockedRoot.mockResolvedValueOnce('..')
    const dvcRoots = await findDvcRootPaths({
      cliPath: mockCliPath,
      cwd: dataRoot,
      pythonBinPath: undefined
    })
    expect(mockedRoot).toBeCalledTimes(1)
    expect(dvcRoots).toEqual([singleDemoRepoPath])
  })

  it('should return an empty array given no dvc root in or above the given directory', async () => {
    const dvcRoots = await findDvcRootPaths({
      cliPath: mockCliPath,
      cwd: __dirname,
      pythonBinPath: undefined
    })
    expect(dvcRoots).toEqual([])
  })
})

describe('exists', () => {
  it('should return true for a directory on disk', () => {
    expect(exists(__dirname)).toBe(true)
  })
  it('should return true for a file on disk', () => {
    expect(exists(__filename)).toBe(true)
  })
  it('should return false for an empty string', () => {
    expect(exists(join(__dirname, __dirname))).toBe(false)
  })
  it('should return false for a path not on disk', () => {
    expect(exists('')).toBe(false)
  })
})

describe('isDirectory', () => {
  it('should return true for a directory', () => {
    expect(isDirectory(__dirname)).toBe(true)
  })
  it('should return false for a file', () => {
    expect(isDirectory(__filename)).toBe(false)
  })
  it('should return false for an empty string', () => {
    expect(isDirectory('')).toBe(false)
  })
})
