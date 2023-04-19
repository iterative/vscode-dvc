export const hasKey = (maybeObject: unknown, key: string): boolean =>
  typeof maybeObject === 'object' &&
  Object.prototype.hasOwnProperty.call(maybeObject, key)

export const createTypedAccumulator = <T extends string>(
  enumLike: Record<string, T>
) => {
  const acc = {} as Record<T, number>
  for (const count of Object.values(enumLike)) {
    acc[count] = 0
  }
  return acc
}
