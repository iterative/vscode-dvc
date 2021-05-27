import { FSWatcher, watch } from 'chokidar'
import { mocked } from 'ts-jest/utils'
import debounce from 'lodash.debounce'
import { join, resolve } from 'path'
import { ensureDirSync, remove } from 'fs-extra'
import * as FileSystem from '.'
import { Disposable } from '../extension'

const {
  exists,
  findDvcRootPaths,
  getWatcher,
  ignoredDotDirectories,
  isDirectory,
  onDidChangeFileSystem,
  onDidChangeFileType,
  onReady
} = FileSystem

jest.mock('chokidar')
jest.mock('lodash.debounce')
jest.mock('../cli/reader')

const mockedWatch = mocked(watch)
const mockedDebounce = mocked(debounce)

beforeEach(() => {
  jest.resetAllMocks()
})

const dvcDemoPath = resolve(__dirname, '..', '..', '..', 'demo')

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

    expect(mockedWatcher.on).toBeCalledTimes(1)
  })
})

describe('onDidChangeFileType', () => {
  it('should called onDidChangeFileSystem with the correct parameters', () => {
    const addSpy = jest
      .spyOn(FileSystem, 'onDidChangeFileSystem')
      .mockReturnValueOnce(Disposable.fn())

    const handler = () => {}

    onDidChangeFileType(dvcDemoPath, ['*.dvc', 'dvc.lock', 'dvc.yaml'], handler)
    expect(addSpy).toBeCalledTimes(1)
    expect(addSpy).toBeCalledWith(
      [
        join(dvcDemoPath, '**', '*.dvc'),
        join(dvcDemoPath, '**', 'dvc.lock'),
        join(dvcDemoPath, '**', 'dvc.yaml')
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
  const dataRoot = resolve(dvcDemoPath, 'data')

  it('should find the dvc root if it exists in the given folder', async () => {
    const dvcRoots = await findDvcRootPaths(dvcDemoPath, Promise.resolve('.'))

    expect(dvcRoots).toEqual([dvcDemoPath])
  })

  it('should find multiple roots if available one directory below the given folder', async () => {
    const parentDir = resolve(dvcDemoPath, '..')
    const mockDvcRoot = join(parentDir, 'mockDvc')
    ensureDirSync(join(mockDvcRoot, '.dvc'))

    const dvcRoots = await findDvcRootPaths(
      parentDir,
      Promise.resolve(undefined)
    )

    remove(mockDvcRoot)

    expect(dvcRoots).toEqual([dvcDemoPath, mockDvcRoot].sort())
  })

  it('should find the dvc root if it exists above the given folder', async () => {
    const dvcRoots = await findDvcRootPaths(dataRoot, Promise.resolve('..'))

    expect(dvcRoots).toEqual([dvcDemoPath])
  })

  it('should return an empty array given no dvc root in or above the given directory', async () => {
    const dvcRoots = await findDvcRootPaths(
      __dirname,
      Promise.resolve(undefined)
    )
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
