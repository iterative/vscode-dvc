export const formatNumber = (value: number): string => {
  const defaultPrecision = 5 // for when we can't calculate real precision yet
  const maxLength = Number.isInteger(value) ? 10 : 7
  const automatic = value.toString()
  if (automatic.length > maxLength) {
    return value.toPrecision(defaultPrecision)
  }
  return automatic
}
