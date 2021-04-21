import { isStringInEnum } from '.'

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
