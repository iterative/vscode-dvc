import { reorderColumnIds } from './columns'

describe('reorderColumnIds()', () => {
  it('should reorder the column ids given a displacer array of ids and a displaced array of ids', () => {
    const emptyColumnIds: string[] = []
    expect(reorderColumnIds(emptyColumnIds, [], [])).toStrictEqual([])

    const twoColumnIds = ['id_1', 'id_2']
    expect(reorderColumnIds(twoColumnIds, [], [])).toStrictEqual(twoColumnIds)
    expect(reorderColumnIds(twoColumnIds, ['id_1'], ['id_1'])).toStrictEqual(
      twoColumnIds
    )
    expect(reorderColumnIds(twoColumnIds, ['id_1'], ['id_2'])).toStrictEqual([
      'id_2',
      'id_1'
    ])
    expect(reorderColumnIds(twoColumnIds, ['id_2'], ['id_1'])).toStrictEqual([
      'id_2',
      'id_1'
    ])

    const threeColumnIds = [...twoColumnIds, 'id_3']
    expect(reorderColumnIds(threeColumnIds, [], [])).toStrictEqual(
      threeColumnIds
    )
    expect(reorderColumnIds(threeColumnIds, ['id_2'], ['id_2'])).toStrictEqual(
      threeColumnIds
    )
    expect(reorderColumnIds(threeColumnIds, ['id_2'], ['id_3'])).toStrictEqual([
      'id_1',
      'id_3',
      'id_2'
    ])
    expect(reorderColumnIds(threeColumnIds, ['id_1'], ['id_3'])).toStrictEqual([
      'id_2',
      'id_3',
      'id_1'
    ])
    expect(
      reorderColumnIds(threeColumnIds, ['id_1', 'id_2'], ['id_3'])
    ).toStrictEqual(['id_3', 'id_1', 'id_2'])
    expect(
      reorderColumnIds(threeColumnIds, ['id_2', 'id_3'], ['id_1'])
    ).toStrictEqual(['id_2', 'id_3', 'id_1'])
  })
})
