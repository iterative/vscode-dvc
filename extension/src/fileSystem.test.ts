import * as fileSystem from './fileSystem'
import { FSWatcher, watch } from 'chokidar'
import { mocked } from 'ts-jest/utils'
import debounce from 'lodash.debounce'
import { basename, join } from 'path'

const { addFileChangeHandler, findCliPath, getWatcher } = fileSystem

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

describe('findCliPath', () => {
  it('should return a path given the name of an available binary', async () => {
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
