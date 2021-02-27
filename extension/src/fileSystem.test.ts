import * as fileSystem from './fileSystem'
import { addFileChangeHandler, getWatcher } from './fileSystem'
import { FSWatcher, watch } from 'chokidar'
import { mocked } from 'ts-jest/utils'
import debounce from 'lodash.debounce'

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
      .mockImplementationOnce((e: any) => e)

    mockedDebounce.mockImplementationOnce(
      (func: (...args: any) => any) => func as any
    )

    const handler = addFileChangeHandler(file, func)
    const { dispose } = handler

    expect(dispose).toBeDefined()

    expect(getWatcherSpy).toBeCalledTimes(1)

    expect(mockedDebounce).toBeCalledTimes(1)
    expect(mockedDebounce).toBeCalledWith(func, 1500, {
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
