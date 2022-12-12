import { createValidInteger } from './number'

describe('createInteger', () => {
  it('should return undefined if given undefined', () => {
    const integer = createValidInteger(undefined)
    expect(integer).toBeUndefined()
  })

  it('should create an integer from a valid string', () => {
    const integer = createValidInteger('1234')
    expect(integer).toStrictEqual(1234)
  })

  it('should return undefined if the string does not represent an integer', () => {
    const integer = createValidInteger('1234.0001')
    expect(integer).toBeUndefined()
  })

  it('should return  if the string does not represent an integer', () => {
    const integer = createValidInteger('1234.0')
    expect(integer).toStrictEqual(1234)
  })

  it('should return undefined if the string is not a number', () => {
    const integer = createValidInteger('A string')
    expect(integer).toBeUndefined()
  })

  it('should return undefined if given a non-integer number', () => {
    const integer = createValidInteger(1234.1)
    expect(integer).toBeUndefined()
  })

  it('should return undefined if given a NaN number', () => {
    const integer = createValidInteger(Number.NaN)
    expect(integer).toBeUndefined()
  })

  it('should return the given integer', () => {
    const integer = createValidInteger(1234)
    expect(integer).toStrictEqual(1234)
  })
})
