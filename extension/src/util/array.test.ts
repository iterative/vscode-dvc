import {
  definedAndNonEmpty,
  flatten,
  joinTruthyItems,
  sameContents
} from './array'

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

describe('flatten', () => {
  it('should flatten an array of arrays', () => {
    expect(flatten<number>([[1], [2, 3, 4], [5, 6, 7, 8, 9, 10]])).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    ])
  })
})

describe('sameContents', () => {
  it('should return true if the arrays contain the same contents in a different order', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8]
    const otherArray = [8, 7, 6, 5, 4, 3, 2, 1]
    expect(sameContents(array, otherArray)).toBe(true)
  })

  it('should return true if the arrays contain the same mixed contents in a different order', () => {
    const array = [1, undefined, '3', null, 5, 6, 7, 8]
    const otherArray = [8, 7, 6, 5, null, '3', undefined, 1]
    expect(sameContents(array, otherArray)).toBe(true)
  })

  it('should return false if the arrays contain different values', () => {
    const array = [1, 2]
    const otherArray = [1]
    expect(sameContents(array, otherArray)).toBe(false)
  })

  it('should return false if the arrays only differ because of an undefined value', () => {
    const array = [1, 2]
    const otherArray = [1, 2, undefined]
    expect(sameContents(array, otherArray)).toBe(false)
  })
})
