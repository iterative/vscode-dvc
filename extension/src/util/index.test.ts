import { delay, isStringInEnum, trimAndSplit } from '.'

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

describe('isStringInEnum', () => {
  enum Animals {
    CAT = 'cat',
    DOG = 'dog',
    FISH = 'fish'
  }
  it('should return true when the string is in the enum', () => {
    expect(isStringInEnum('fish', Animals)).toBe(true)
  })

  it('should return false when it is not', () => {
    expect(isStringInEnum('brick', Animals)).toBe(false)
  })

  it('should return false when the string has the wrong case', () => {
    expect(isStringInEnum('fIsh', Animals)).toBe(false)
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
