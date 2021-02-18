import * as fileSystem from './fileSystem'
import fs from 'fs'
import { mocked } from 'ts-jest/utils'
import debounce from 'lodash.debounce'

const { addFileChangeHandler, getWatcher } = fileSystem

jest.mock('fs')
jest.mock('lodash.debounce')

const mockedFs = mocked(fs)
const mockedDebounce = mocked(debounce)

beforeEach(() => {
  jest.resetAllMocks()
})

describe('addFileChangeHandler', () => {
  it('should call fs.watch with the correct parameters', () => {
    const file = '/some/file.csv'
    const func = () => undefined

    const getWatcherSpy = jest
      .spyOn(fileSystem, 'getWatcher')
      .mockImplementationOnce((e: any) => e)

    mockedDebounce.mockImplementationOnce(
      (func: (...args: any) => any) => func as any
    )

    const { dispose } = addFileChangeHandler(file, func)

    expect(dispose).toBeDefined()
    expect(getWatcherSpy).toBeCalledTimes(1)
    expect(mockedDebounce).toBeCalledTimes(1)
    expect(mockedDebounce).toBeCalledWith(func, 1500, {
      leading: true,
      trailing: false
    })
    expect(mockedFs.watch).toBeCalledWith(file, func)
    expect(mockedFs.watch).toBeCalledTimes(1)
  })
})

describe('getWatcher', () => {
  const mockHandler = jest.fn()
  const file = '/some/file/on/a/system.log'

  it('should return a new file watcher callback which calls the handler on change', () => {
    const watcher = getWatcher(mockHandler)

    watcher('change', file)

    expect(mockHandler).toBeCalledTimes(1)
  })

  it('should return a new file watcher callback which does not call the handler on rename', () => {
    const watcher = getWatcher(mockHandler)

    watcher('rename', file)

    expect(mockHandler).not.toBeCalled()
  })

  it('should return a new file watcher callback which does not call the handler without a filename', () => {
    const watcher = getWatcher(mockHandler)

    watcher('change', '')

    expect(mockHandler).not.toBeCalled()
  })
})
