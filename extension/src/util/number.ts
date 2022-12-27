const validateNumericInteger = (number: number): number | undefined =>
  !Number.isNaN(number) && Number.isInteger(number) ? number : undefined

export const formatNumber = (value: number): string => {
  const defaultPrecision = 8 // for when we can't calculate real precision yet
  const automatic = value.toString()
  if (automatic.length > 10) {
    return value.toPrecision(defaultPrecision)
  }
  return automatic
}

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
