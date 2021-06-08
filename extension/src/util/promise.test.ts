import { mocked } from 'ts-jest/utils'
import { delay } from './time'
import { retryUntilAllResolved } from './promise'

const mockedDelay = mocked(delay)

jest.mock('./time')
jest.mock('../common/logger')

beforeEach(() => {
  jest.resetAllMocks()
})

describe('retryUntilAllResolved', () => {
  it('should resolve a single promise and return the output', async () => {
    const returnValue = 'I DID IT! WEEEEE'
    const promise = jest.fn().mockResolvedValueOnce(returnValue)

    const promiseRefresher = jest.fn().mockImplementation(() => promise())

    const output = await retryUntilAllResolved<string>(
      promiseRefresher,
      'Definitely did not'
    )

    expect(output).toEqual(returnValue)

    expect(promiseRefresher).toBeCalledTimes(1)
    expect(mockedDelay).not.toBeCalled()
  })

  it('should not retry if all of the promises that it is passed resolve', async () => {
    const p1 = jest.fn().mockResolvedValueOnce(1)
    const p2 = jest.fn().mockResolvedValueOnce(2)
    const p3 = jest.fn().mockResolvedValueOnce(3)
    const p4 = jest.fn().mockResolvedValueOnce(4)
    const p5 = jest.fn().mockResolvedValueOnce(5)
    const p6 = jest.fn().mockResolvedValueOnce(6)
    const p7 = jest.fn().mockResolvedValueOnce(7)
    const p8 = jest.fn().mockResolvedValueOnce(8)

    const promiseRefresher = jest
      .fn()
      .mockImplementation(() => [
        p1(),
        p2(),
        p3(),
        p4(),
        p5(),
        p6(),
        p7(),
        p8()
      ])

    const output = await retryUntilAllResolved<number[]>(
      promiseRefresher,
      'Definitely did not'
    )

    expect(output).toEqual([1, 2, 3, 4, 5, 6, 7, 8])

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

    await retryUntilAllResolved<string>(promiseRefresher, 'Data update')

    expect(promiseRefresher).toBeCalledTimes(4)
    expect(mockedDelay).toBeCalledTimes(3)
    expect(mockedDelay).toBeCalledWith(500)
    expect(mockedDelay).toBeCalledWith(1000)
    expect(mockedDelay).toBeCalledWith(2000)
  })

  it('should retry any time any of the promises it is passed rejects', async () => {
    const rejectsFirstPromise = jest
      .fn()
      .mockRejectedValueOnce('I dead')
      .mockRejectedValueOnce('I worked')
      .mockResolvedValueOnce("we're both ok")

    const rejectsSecondPromise = jest
      .fn()
      .mockRejectedValueOnce('I worked')
      .mockRejectedValueOnce('I dead')
      .mockResolvedValueOnce("we're both ok")

    mockedDelay.mockResolvedValue()

    const promiseRefresher = jest
      .fn()
      .mockImplementation(() => [rejectsFirstPromise(), rejectsSecondPromise()])

    await retryUntilAllResolved<[string, string]>(
      promiseRefresher,
      'Data update'
    )

    expect(promiseRefresher).toBeCalledTimes(3)
    expect(mockedDelay).toBeCalledTimes(2)
    expect(mockedDelay).toBeCalledWith(500)
    expect(mockedDelay).toBeCalledWith(1000)
  })
})
