import { flattenMapValues } from './map'

describe('flattenMapValues', () => {
  it('should flatten a map of arrays', () => {
    expect(
      flattenMapValues<number>(
        new Map<string, number[]>([
          ['A', [1]],
          ['B', [2, 3, 4]],
          ['C', [5, 6, 7, 8, 9, 10]]
        ])
      )
    ).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('should return all of the original items', () => {
    expect(
      flattenMapValues<number>(
        new Map<string, number[]>([
          ['A', [1]],
          ['B', [2, 3, 4, 5, 6, 7, 8]],
          ['C', [5, 6, 7, 8, 9, 10]]
        ])
      )
    ).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 5, 6, 7, 8, 9, 10])
  })
})
