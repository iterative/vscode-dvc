import { parseNonStandardJson } from './json'

describe('parseNonStandardJson', () => {
  it('should parse NaN', () => {
    expect(parseNonStandardJson('{NotANumber:NaN}')).toStrictEqual({
      NotANumber: Number.NaN
    })
  })

  it('should parse Infinity', () => {
    expect(
      parseNonStandardJson(
        '{negativeInfinity:-Infinity, positiveInfinity: Infinity}'
      )
    ).toStrictEqual({
      negativeInfinity: Number.NEGATIVE_INFINITY,
      positiveInfinity: Number.POSITIVE_INFINITY
    })
  })
})
