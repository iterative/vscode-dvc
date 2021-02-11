import { delay } from './util'

test('Delay', async () => {
  let changedAfterDelay = false
  const delayThenChangePromise = delay(50).then(() => {
    changedAfterDelay = true
  })
  expect(changedAfterDelay).toEqual(false)
  await delayThenChangePromise
  expect(changedAfterDelay).toEqual(true)
})
