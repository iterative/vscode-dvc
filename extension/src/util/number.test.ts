import { coerceStringNumbers, createValidInteger } from './number'

describe('createInteger', () => {
  it('should return undefined if given undefined', () => {
    const integer = createValidInteger(undefined)
    expect(integer).toBeUndefined()
  })

  it('should create an integer from a valid string', () => {
    const integer = createValidInteger('1234')
    expect(integer).toStrictEqual(1234)
  })

  it('should create an integer from a string with a space at the start', () => {
    const integer = createValidInteger(' 3538')
    expect(integer).toStrictEqual(3538)
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

describe('coerceStringNumbers', () => {
  it('should not coerce a non-string number', () => {
    expect(coerceStringNumbers('a')).toStrictEqual('a')
    expect(coerceStringNumbers('1,2')).toStrictEqual('1,2')
    expect(coerceStringNumbers('')).toStrictEqual('')
    expect(coerceStringNumbers('    ')).toStrictEqual('    ')
    expect(coerceStringNumbers('-Inf')).toStrictEqual('-Inf')
  })

  it('should coerce a string that is a number', () => {
    expect(coerceStringNumbers('1.234')).toStrictEqual(1.234)
    expect(coerceStringNumbers('1234')).toStrictEqual(1234)
    expect(coerceStringNumbers('-1234')).toStrictEqual(-1234)
    expect(coerceStringNumbers('-1234.0001')).toStrictEqual(-1234.0001)
    expect(coerceStringNumbers('123456789.0001010101111')).toStrictEqual(
      // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
      123456789.0001010101111
    )
    expect(coerceStringNumbers('2.298783302307129')).toStrictEqual(
      2.298783302307129
    )
    expect(coerceStringNumbers('1.9573605060577393')).toStrictEqual(
      1.9573605060577393
    )
  })

  it('should not coerce null or undefined', () => {
    expect(coerceStringNumbers(undefined)).toStrictEqual(undefined)
    expect(coerceStringNumbers(null)).toStrictEqual(null)
  })

  it('should not coerce true or false', () => {
    expect(coerceStringNumbers(true)).toStrictEqual(true)
    expect(coerceStringNumbers(false)).toStrictEqual(false)
  })

  it('should not coerce an object', () => {
    expect(coerceStringNumbers({})).toStrictEqual({})
  })

  it('should not coerce an array', () => {
    expect(coerceStringNumbers([])).toStrictEqual([])
  })
})
