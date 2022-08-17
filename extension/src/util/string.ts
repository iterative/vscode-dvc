export const shortenForLabel = <T extends string | null>(
  strOrNull: T
): T | string => (strOrNull ? strOrNull.slice(0, 7) : strOrNull)
