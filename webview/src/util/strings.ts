export const minWordLength = (value: string) => {
  return value
    .split(' ')
    .map(a => a.length)
    .reduce((a, b) => Math.min(a, b), 10000)
}
