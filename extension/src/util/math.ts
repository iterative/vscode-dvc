export const sum = (values: number[]): number => {
  let sum = 0
  values.forEach(value => (sum += value))
  return sum
}
