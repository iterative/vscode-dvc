import { retry } from './retry'
import { delay } from '../util/time'

const mockedDelay = jest.mocked(delay)

jest.mock('../util/time')
jest.mock('../common/logger')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('retry', () => {
  it('should resolve a single promise and return the output', async () => {
    const returnValue = 'I DID IT! WEEEEE'
    const promise = jest.fn().mockResolvedValueOnce(returnValue)

    const promiseRefresher = jest.fn().mockImplementation(() => promise())

    const output = await retry<string>(promiseRefresher, 'Definitely did not')

    expect(output).toEqual(returnValue)

    expect(promiseRefresher).toBeCalledTimes(1)
    expect(mockedDelay).not.toBeCalled()
  })

  it('should retry each time a promise rejects', async () => {
    const unreliablePromise = jest
      .fn()
      .mockRejectedValueOnce(new Error('I dead because the repo is locked'))
      .mockRejectedValueOnce(
        new Error(
          'I dead again. Check the page <https://dvc.org/doc/user-guide/troubleshooting#lock-issue>'
        )
      )
      .mockRejectedValueOnce(
        new Error('I dead AGAIN! Try deleting .dvc/tmp/rwlock')
      )
      .mockResolvedValueOnce("he's ok")

    mockedDelay.mockResolvedValue()

    const promiseRefresher = jest
      .fn()
      .mockImplementation(() => unreliablePromise())

    await retry<string>(promiseRefresher, 'Data update')

    expect(promiseRefresher).toBeCalledTimes(4)
    expect(mockedDelay).toBeCalledTimes(3)
    expect(mockedDelay).toBeCalledWith(500)
    expect(mockedDelay).toBeCalledWith(1000)
    expect(mockedDelay).toBeCalledWith(2000)
  })
})
