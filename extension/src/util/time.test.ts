import { delay, StopWatch } from './time'

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('delay', () => {
  it('should provide a delay in execution', async () => {
    let changedAfterDelay = false
    const delayThenChangePromise = delay(5000).then(() => {
      changedAfterDelay = true
    })
    expect(changedAfterDelay).toStrictEqual(false)
    jest.advanceTimersByTime(5000)
    await delayThenChangePromise
    expect(changedAfterDelay).toStrictEqual(true)
  })
})

describe('StopWatch', () => {
  it('should provide the elapsed time', async () => {
    const stopWatch = new StopWatch()

    const elapsedTime = 123456787654321

    const timeToWait = delay(elapsedTime)

    jest.advanceTimersByTime(elapsedTime)

    await timeToWait

    expect(stopWatch.getElapsedTime()).toStrictEqual(elapsedTime)
  })

  it('should be able to reset the elapsed time to 0', async () => {
    const stopWatch = new StopWatch()

    const elapsedTime = 400

    const timeToWait = delay(elapsedTime)

    jest.advanceTimersByTime(elapsedTime)

    await timeToWait

    expect(stopWatch.getElapsedTime()).not.toStrictEqual(0)
    stopWatch.reset()
    expect(stopWatch.getElapsedTime()).toStrictEqual(0)
  })
})
