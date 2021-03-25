import * as fileSystem from './fileSystem'
import { FSWatcher, watch } from 'chokidar'
import { mocked } from 'ts-jest/utils'
import debounce from 'lodash.debounce'
import { dirname, join, resolve } from 'path'
import { mkdirSync, rmdir } from 'fs-extra'
import { getRoot } from './cli/reader'

const { addFileChangeHandler, findDvcRootPaths, getWatcher } = fileSystem

jest.mock('chokidar')
jest.mock('lodash.debounce')
jest.mock('./cli/reader')

const mockedWatch = mocked(watch)
const mockedDebounce = mocked(debounce)
const mockGetRoot = mocked(getRoot)

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
