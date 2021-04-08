import { delay, trimAndSplit } from '.'

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

describe('trimAndSplit', () => {
  it('should return an empty array given an empty string', () => {
    expect(trimAndSplit('')).toEqual([])
  })

  it('should return an empty array given an newline', () => {
    expect(trimAndSplit('\n')).toEqual([])
  })

  it('should return an array given a string separated by newlines', () => {
    expect(trimAndSplit('a\nb\nc\n')).toEqual(['a', 'b', 'c'])
  })
})
