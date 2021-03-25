import * as fileSystem from './fileSystem'
import { FSWatcher, watch } from 'chokidar'
import { mocked } from 'ts-jest/utils'
import debounce from 'lodash.debounce'
import { basename, dirname, join, resolve } from 'path'
import { mkdirSync, rmdir } from 'fs-extra'
import { getRoot, listDvcOnlyRecursive } from './cli/reader'

const {
  addFileChangeHandler,
  findCliPath,
  findDvcRootPaths,
  findDvcTrackedPaths,
  getAbsoluteTrackedPath,
  getWatcher
} = fileSystem

jest.mock('chokidar')
jest.mock('lodash.debounce')
jest.mock('./cli/reader')

const mockedWatch = mocked(watch)
const mockedDebounce = mocked(debounce)
const mockGetRoot = mocked(getRoot)
const mockListDvcOnlyRecursive = mocked(listDvcOnlyRecursive)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('addFileChangeHandler', () => {
  it('should call fs.watch with the correct parameters', () => {
    const file = '/some/file.csv'
    const func = () => undefined

    const mockedWatcher = mocked(new FSWatcher())
    mockedWatch.mockReturnValue(mockedWatcher)

    const getWatcherSpy = jest
      .spyOn(fileSystem, 'getWatcher')
      .mockImplementationOnce(e => e)

    mockedDebounce.mockImplementationOnce(
      (func: (...args: string[]) => void) =>
        func as {
          (...args: string[]): void
          cancel(): void
          flush(): void
        }
    )

    const { dispose } = addFileChangeHandler(file, func)

    expect(dispose).toBeDefined()

    expect(getWatcherSpy).toBeCalledTimes(1)

    expect(mockedDebounce).toBeCalledTimes(1)
    expect(mockedDebounce).toBeCalledWith(func, 500, {
      leading: false,
      trailing: true
    })

    expect(mockedWatch).toBeCalledWith(file)
    expect(mockedWatch).toBeCalledTimes(1)

    expect(mockedWatcher.on).toBeCalledTimes(4)
    expect(mockedWatcher.on).toBeCalledWith('ready', func)
    expect(mockedWatcher.on).toBeCalledWith('add', func)
    expect(mockedWatcher.on).toBeCalledWith('change', func)
    expect(mockedWatcher.on).toBeCalledWith('unlink', func)
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

describe('findCliPath', () => {
  it('should return a cli name given the name of a globally available cli', async () => {
    const mockWorkspace = __dirname
    const cli = 'git'
    const accessiblePath = await findCliPath(mockWorkspace, cli)
    expect(accessiblePath).toEqual(cli)
  })

  it('should return a path given an absolute path and no cwd', async () => {
    const mockCli = __filename
    const mockWorkspace = ''
    const accessiblePath = await findCliPath(mockWorkspace, mockCli)
    expect(accessiblePath).toEqual(mockCli)
  })

  it('should return a path given a relative path and cwd', async () => {
    const mockCli = basename(__filename)
    const mockWorkspace = __dirname
    const accessiblePath = await findCliPath(mockWorkspace, mockCli)
    expect(accessiblePath).toEqual(__filename)
  })

  it('should return a path given a relative path which does not exactly match the cwd', async () => {
    const mockCli = basename(__filename)
    const mockWorkspace = __dirname
    const accessiblePath = await findCliPath(join(mockWorkspace, '..'), mockCli)
    expect(accessiblePath).toEqual(__filename)
  })

  it('should return undefined given a non-existent file to find', async () => {
    const mockWorkspace = __dirname
    const accessiblePath = await findCliPath(mockWorkspace, 'non-existent-cli')
    expect(accessiblePath).toBeUndefined()
  })
})

describe('findDvcRootPaths', () => {
  const demoFolderLocation = resolve(__dirname, '..', '..', 'demo')
  const dataRoot = resolve(demoFolderLocation, 'data')
  const mockCliPath = 'dvc'

  it('should find the dvc root if it exists in the given folder', async () => {
    mockGetRoot.mockResolvedValueOnce('.')
    const dvcRoots = await findDvcRootPaths(demoFolderLocation, mockCliPath)

    expect(mockGetRoot).toBeCalledTimes(1)
    expect(dvcRoots).toEqual([demoFolderLocation])
  })

  it('should find multiple roots if available in the given folder', async () => {
    mockGetRoot.mockResolvedValueOnce('.')
    const mockDvcRoot = join(dataRoot, '.dvc')
    mkdirSync(mockDvcRoot)

    const dvcRoots = await findDvcRootPaths(demoFolderLocation, mockCliPath)

    rmdir(mockDvcRoot)

    expect(mockGetRoot).toBeCalledTimes(1)
    expect(dvcRoots).toEqual([demoFolderLocation, dataRoot].sort())
  })

  it('should find multiple roots if one is above and one is below the given folder', async () => {
    mockGetRoot.mockResolvedValueOnce('..')
    const mockDvcRoot = join(dataRoot, 'MNIST', '.dvc')
    mkdirSync(mockDvcRoot)

    const dvcRoots = await findDvcRootPaths(dataRoot, mockCliPath)

    rmdir(mockDvcRoot)

    expect(mockGetRoot).toBeCalledTimes(1)
    expect(dvcRoots).toEqual([demoFolderLocation, dirname(mockDvcRoot)].sort())
  })

  it('should find the dvc root if it exists above the given folder', async () => {
    mockGetRoot.mockResolvedValueOnce('..')
    const dvcRoots = await findDvcRootPaths(dataRoot, mockCliPath)
    expect(mockGetRoot).toBeCalledTimes(1)
    expect(dvcRoots).toEqual([demoFolderLocation])
  })

  it('should return an empty array given no dvc root in or above the given directory', async () => {
    const dvcRoots = await findDvcRootPaths(__dirname, mockCliPath)
    expect(dvcRoots).toEqual([])
  })
})

describe('getAbsoluteTrackedPath', () => {
  it('should find all the .dvc files in the workspace and return them in a Set', async () => {
    const demoFolderLocation = resolve(__dirname, '..', '..', 'demo')
    const tracked = getAbsoluteTrackedPath([
      join(demoFolderLocation, 'somefile.txt.dvc')
    ])

    expect(tracked).toEqual([join(demoFolderLocation, 'somefile.txt')])
  })
})

describe('findDvcTrackedPaths', () => {
  const demoFolderLocation = resolve(__dirname, '..', '..', 'demo')

  it('should find the .dvc files in the workspace and return them in a Set', async () => {
    mockListDvcOnlyRecursive.mockResolvedValueOnce([])
    const tracked = await findDvcTrackedPaths(demoFolderLocation, 'dvc')

    expect(tracked).toEqual(
      new Set([resolve(demoFolderLocation, 'data', 'MNIST', 'raw')])
    )
  })

  it('should return a Set of tracked files, their folders and any .dvc files', async () => {
    const logFolder = 'logs'
    const logAcc = join(logFolder, 'acc.tsv')
    const logLoss = join(logFolder, 'loss.tsv')
    const model = 'model.pt'
    mockListDvcOnlyRecursive.mockResolvedValueOnce([logAcc, logLoss, model])
    const tracked = await findDvcTrackedPaths(demoFolderLocation, 'dvc')

    expect(tracked).toEqual(
      new Set([
        resolve(demoFolderLocation, 'data', 'MNIST', 'raw'),
        resolve(demoFolderLocation, logAcc),
        resolve(demoFolderLocation, logLoss),
        resolve(demoFolderLocation, logFolder),
        resolve(demoFolderLocation, model)
      ])
    )
  })
})
