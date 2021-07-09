export const definedAndNonEmpty = (
  maybeArray: unknown[] | undefined
): maybeArray is unknown[] => {
  return !!maybeArray?.length
}

export const flatten = <T = string>(arrayOfArrays: T[][]): T[] =>
  ([] as T[]).concat(...arrayOfArrays)

export const joinTruthyItems = (array: (string | undefined)[], sep = ' ') =>
  array.filter(Boolean).join(sep)
