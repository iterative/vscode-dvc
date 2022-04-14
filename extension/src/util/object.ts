export const hasKey = (maybeObject: unknown, key: string): boolean =>
  typeof maybeObject === 'object' &&
  Object.prototype.hasOwnProperty.call(maybeObject, key)

export const removeMissingKeysFromObject = <
  T extends { [key: string]: unknown }
>(
  retainKeys: string[],
  items: T
): T => {
  const copy = { ...items }
  for (const key of Object.keys(copy)) {
    if (!retainKeys.includes(key)) {
      delete copy[key]
    }
  }
  return copy
}

export const createTypedAccumulator = <T extends string>(
  enumLike: Record<string, T>
) => {
  const acc = {} as Record<T, number>
  for (const count of Object.values(enumLike)) {
    acc[count] = 0
  }
  return acc
}
