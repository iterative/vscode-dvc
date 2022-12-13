const validateNumericInteger = (number: number): number | undefined =>
  !Number.isNaN(number) && Number.isInteger(number) ? number : undefined

export const createValidInteger = (
  input: string | number | undefined
): number | undefined => {
  if (!input) {
    return
  }

  if (typeof input === 'number') {
    return validateNumericInteger(input)
  }

  return Number.parseInt(input) === Number.parseFloat(input)
    ? Number.parseInt(input)
    : undefined
}
