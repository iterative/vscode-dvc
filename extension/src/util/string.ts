export const shortenForLabel = <T extends string | null>(
  strOrNull: T
): T | string => {
  if (typeof strOrNull === 'string') {
    return strOrNull?.slice(0, 7)
  }
  return strOrNull
}
