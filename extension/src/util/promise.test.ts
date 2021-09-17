import { mocked } from 'ts-jest/utils'
import { delay } from './time'
import { retryUntilResolved } from './promise'

const mockedDelay = mocked(delay)

jest.mock('./time')
jest.mock('../common/logger')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('retryUntilResolved', () => {
  it('should resolve a single promise and return the output', async () => {
    const returnValue = 'I DID IT! WEEEEE'
    const promise = jest.fn().mockResolvedValueOnce(returnValue)

    const promiseRefresher = jest.fn().mockImplementation(() => promise())

    const output = await retryUntilResolved<string>(
      promiseRefresher,
      'Definitely did not'
    )

    expect(output).toEqual(returnValue)

    expect(promiseRefresher).toBeCalledTimes(1)
    expect(mockedDelay).not.toBeCalled()
  })

  it('should retry each time a promise rejects', async () => {
    const unreliablePromise = jest
      .fn()
      .mockRejectedValueOnce('I dead')
      .mockRejectedValueOnce('I dead again')
      .mockRejectedValueOnce('I dead AGAIN!')
      .mockResolvedValueOnce("he's ok")

    mockedDelay.mockResolvedValue()

    const promiseRefresher = jest
      .fn()
      .mockImplementation(() => unreliablePromise())

    await retryUntilResolved<string>(promiseRefresher, 'Data update')

    expect(promiseRefresher).toBeCalledTimes(4)
    expect(mockedDelay).toBeCalledTimes(3)
    expect(mockedDelay).toBeCalledWith(500)
    expect(mockedDelay).toBeCalledWith(1000)
    expect(mockedDelay).toBeCalledWith(2000)
  })
})
