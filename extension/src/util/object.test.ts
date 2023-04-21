import { createTypedAccumulator } from './object'

describe('createTypedAccumulator', () => {
  it('should create a typed accumulator from an enum like object', () => {
    const obj = { A: 'a', B: 'b' } as const
    const typedAccumulator: Record<'a' | 'b', number> =
      createTypedAccumulator(obj)

    expect(typedAccumulator).toStrictEqual({ a: 0, b: 0 })
  })
})
