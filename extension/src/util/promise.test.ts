import { mocked } from 'ts-jest/utils'
import { delay } from '.'
import { retryUntilAllResolved } from './promise'

const mockedDelay = mocked(delay)

jest.mock('.')
jest.mock('../common/Logger')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('retryUntilAllResolved', () => {
  it('should retry each time a promise fails', async () => {
    const mockPromise = jest
      .fn()
      .mockRejectedValueOnce('I dead')
      .mockRejectedValueOnce('I dead again')
      .mockRejectedValueOnce('I dead AGAIN!')
      .mockResolvedValueOnce("he's ok")

    mockedDelay.mockResolvedValue()

    const promiseRefresher = jest.fn().mockImplementation(() => [mockPromise()])
    await retryUntilAllResolved(promiseRefresher, 'Data update failed')
    expect(promiseRefresher).toBeCalledTimes(4)
    expect(mockedDelay).toBeCalledTimes(3)
    expect(mockedDelay).toBeCalledWith(500)
    expect(mockedDelay).toBeCalledWith(1000)
    expect(mockedDelay).toBeCalledWith(2000)
  })

  it('should retry any time a any of the promises it is passed fails', async () => {
    const mockFirstPromise = jest
      .fn()
      .mockRejectedValueOnce('I dead')
      .mockRejectedValueOnce('I worked')
      .mockResolvedValueOnce("we're both ok")

    const mockSecondPromise = jest
      .fn()
      .mockRejectedValueOnce('I worked')
      .mockRejectedValueOnce('I dead')
      .mockResolvedValueOnce("we're both ok")

    mockedDelay.mockResolvedValue()

    const promiseRefresher = jest
      .fn()
      .mockImplementation(() => [mockFirstPromise(), mockSecondPromise()])
    await retryUntilAllResolved(promiseRefresher, 'Data update failed')
    expect(promiseRefresher).toBeCalledTimes(3)
    expect(mockedDelay).toBeCalledTimes(2)
    expect(mockedDelay).toBeCalledWith(500)
    expect(mockedDelay).toBeCalledWith(1000)
  })
})
