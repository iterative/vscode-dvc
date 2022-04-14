import { createTypedAccumulator, removeMissingKeysFromObject } from './object'

describe('removeMissingKeysFromObject', () => {
  it('should remove any keys that exist in the object but not the provided array', () => {
    const expectedKeys = ['A', 'B', 'C', 'D']
    const extendedObject = {
      A: 1,
      B: 2,
      C: 3,
      D: 4,
      E: 5,
      F: 6,
      G: 7
    }

    expect(
      removeMissingKeysFromObject(expectedKeys, extendedObject)
    ).toStrictEqual({
      A: 1,
      B: 2,
      C: 3,
      D: 4
    })
  })

  it('should not mutate the original object', () => {
    const expectedKeys: string[] = []
    const extendedObject = {
      A: 1,
      B: 2,
      C: 3,
      D: 4,
      E: 5,
      F: 6,
      G: 7
    }
    const copyExtendedObject = { ...extendedObject }

    const emptyObject = removeMissingKeysFromObject(
      expectedKeys,
      extendedObject
    )

    expect(emptyObject).toStrictEqual({})
    expect(extendedObject).not.toStrictEqual({})
    expect(extendedObject).toStrictEqual(copyExtendedObject)
  })
})

describe('createTypedAccumulator', () => {
  it('should create a typed accumulator from an enum like object', () => {
    const obj = { A: 'a', B: 'b' } as const
    const typedAccumulator: Record<'a' | 'b', number> =
      createTypedAccumulator(obj)

    expect(typedAccumulator).toStrictEqual({ a: 0, b: 0 })
  })
})
