import { joinTruthyItems } from './array'

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
