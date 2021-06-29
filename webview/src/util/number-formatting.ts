const defaultPrecision = 5 // for when we can't calculate real precision yet

export const formatFloat = (value: number): string => {
  const automatic = value.toString()
  if (automatic.length > 7) {
    return value.toPrecision(defaultPrecision)
  }
  return automatic
}
