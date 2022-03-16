export const sum = (values: number[]): number => {
  let sum = 0
  for (const value of values) {
    sum += value
  }
  return sum
}
