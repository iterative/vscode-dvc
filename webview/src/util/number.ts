export const formatFloat = (value: number): string => {
  const defaultPrecision = 5 // for when we can't calculate real precision yet
  const automatic = value.toString()
  if (automatic.length > 7) {
    return value.toPrecision(defaultPrecision)
  }
  return automatic
}
