export const definedAndNonEmpty = (
  maybeArray: unknown[] | undefined
): maybeArray is unknown[] => {
  return !!maybeArray?.length
}

export const joinTruthyItems = (array: (string | undefined)[], sep = ' ') =>
  array.filter(Boolean).join(sep)
