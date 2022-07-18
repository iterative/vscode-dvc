export const capitalize = (s: string) =>
  s[0].toUpperCase() + s.slice(1).toLowerCase()

export const pluralize = (word: string, number: number | undefined) =>
  number === 1 ? word : `${word}s`
