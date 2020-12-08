const defaultPrecision = 5 // for when we can't calculate real precision yet

const addSign: (num: string) => string = num =>
  (num[0] === '-' ? '' : '+') + num

export const formatFloat = (value: number): string => {
  const automatic = value.toString()
  if (automatic.length > 7) {
    return value.toPrecision(defaultPrecision)
  }
  return automatic
}

export const formatSignedFloat = (value: number): string =>
  addSign(formatFloat(value))

export const formatInteger: (value: number) => string = value => String(value)

export const formatSignedInteger: (value: number) => string = value =>
  addSign(formatInteger(value))

export const formatLargeInteger: (value: number) => string = value =>
  value.toLocaleString('en')

export const formatLargeIntegerSigned: (num: number) => string = num =>
  addSign(formatLargeInteger(num))

const suffixes = ' KMBT'
export const abbreviateInteger: (value: number) => string = value => {
  const exponent = Math.floor(Math.log10(Math.max(Math.abs(value), 1)) / 3)

  if (exponent === 0) return String(value)

  const suffix = suffixes[exponent]
  const shortValue = (value / 1000 ** exponent).toFixed(1)

  return shortValue + suffix
}

export const abbreviateIntegerSigned: (value: number) => string = value =>
  addSign(abbreviateInteger(value))
