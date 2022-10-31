export const shortenForLabel = <T extends string | null>(
  strOrNull: T
): T | string => (strOrNull ? strOrNull.slice(0, 7) : strOrNull)

export const truncateFromLeft = (str: string, length: number): string => {
  return str.length > length ? '...' + str.slice(str.length - length) : str
}
