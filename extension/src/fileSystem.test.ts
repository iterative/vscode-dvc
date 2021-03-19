import * as fileSystem from './fileSystem'
import { FSWatcher, watch } from 'chokidar'
import { mocked } from 'ts-jest/utils'
import debounce from 'lodash.debounce'
import { basename, join } from 'path'

const {
  addFileChangeHandler,
  isBinaryAccessible,
  isFileAccessible,
  findBinaryPath,
  getWatcher
} = fileSystem

jest.mock('chokidar')
jest.mock('lodash.debounce')

const mockedWatch = mocked(watch)
const mockedDebounce = mocked(debounce)

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

describe('isBinaryAccessible', () => {
  it('should return true for a binary in the path', async () => {
    const accessible = await isBinaryAccessible('git')

    expect(accessible).toBe(true)
  })

  it('should return false for a binary which is not in the path', async () => {
    const accessible = await isBinaryAccessible('iamnotabinary')

    expect(accessible).toBe(false)
  })
})

describe('isFileAccessible', () => {
  it('should return true for an accessible file', async () => {
    const accessible = isFileAccessible(__filename)

    expect(accessible).toBe(true)
  })

  it('should return false for a non-existent file', async () => {
    const accessible = isFileAccessible('/some/made/up/file/fun')

    expect(accessible).toBe(false)
  })
})

describe('findBinaryPath', () => {
  it('should return a path given the name of an available binary', async () => {
    const git = 'git'
    const accessiblePath = await findBinaryPath(__dirname, git)
    expect(accessiblePath).toEqual(git)
  })

  it('should return a path given an absolute path and no cwd', async () => {
    const accessiblePath = await findBinaryPath('', __filename)
    expect(accessiblePath).toEqual(__filename)
  })

  it('should return a path given a relative path and cwd', async () => {
    const filename = basename(__filename)
    const accessiblePath = await findBinaryPath(__dirname, filename)
    expect(accessiblePath).toEqual(__filename)
  })

  it('should return a path given a relative path which does not exactly match the cwd', async () => {
    const filename = basename(__filename)
    const accessiblePath = await findBinaryPath(join(__dirname, '..'), filename)
    expect(accessiblePath).toEqual(__filename)
  })

  it('should return undefined given a non-existent file to find', async () => {
    const accessiblePath = await findBinaryPath(
      join(__dirname, '..'),
      'non-existent-file.ts'
    )
    expect(accessiblePath).toBeUndefined()
  })
})
