import isEqual from 'lodash.isequal'

export const definedAndNonEmpty = (
  maybeArray: readonly unknown[] | undefined
): maybeArray is unknown[] => {
  return !!maybeArray?.length
}

export const uniqueValues = <T = string>(array: T[]): T[] => [
  ...new Set<T>(array)
]

export const flattenUnique = <T = string>(arrayOfArrays: T[][]): T[] =>
  uniqueValues(arrayOfArrays.flat())

export const joinTruthyItems = (array: (string | undefined)[], sep = ' ') =>
  array.filter(Boolean).join(sep)

export const sameContents = (
  array: (null | string | number | undefined)[],
  otherArray: (null | string | number | undefined)[]
) => isEqual(array.sort(), otherArray.sort())
