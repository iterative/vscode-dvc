import { delay } from './time'

describe('delay', () => {
  it('should provide a delay in execution', async () => {
    let changedAfterDelay = false
    const delayThenChangePromise = delay(50).then(() => {
      changedAfterDelay = true
    })
    expect(changedAfterDelay).toEqual(false)
    await delayThenChangePromise
    expect(changedAfterDelay).toEqual(true)
  })
})
