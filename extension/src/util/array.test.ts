import { definedAndNonEmpty, joinTruthyItems } from './array'

describe('definedAndNonEmpty', () => {
  it('should return true given a non empty array', () => {
    const maybeArray = ['a', 'b']

    expect(definedAndNonEmpty(maybeArray)).toBe(true)
  })

  it('should return false given an empty array', () => {
    const maybeArray = [] as unknown[]

    expect(definedAndNonEmpty(maybeArray)).toBe(false)
  })

  it('should return false given no array', () => {
    const maybeArray = undefined

    expect(definedAndNonEmpty(maybeArray)).toBe(false)
  })
})

describe('joinTruthyItems', () => {
  it('should join the truthy items in the given array with the default separator', () => {
    const string = joinTruthyItems([
      'a',
      'b',
      'c',
      undefined,
      'd',
      undefined,
      undefined,
      'e'
    ])

    expect(string).toEqual('a b c d e')
  })

  it('should join the truthy items in the given array with the given separator', () => {
    const string = joinTruthyItems(
      [
        undefined,
        'a',
        'b',
        'c',
        'd',
        undefined,
        undefined,
        undefined,
        undefined,
        'e',
        undefined
      ],
      ':'
    )

    expect(string).toEqual('a:b:c:d:e')
  })
})
