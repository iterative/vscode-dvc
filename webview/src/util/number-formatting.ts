const defaultPrecision = 5 // for when we can't calculate real precision yet
const defaultType = 'fixed'

const addSign: (num: string) => string = num =>
  (num[0] === '-' ? '' : '+') + num

export const formatSigned = (
  value: number,
  precision: number = defaultPrecision,
  method: 'fixed' | 'precision' = defaultType
): string => {
  if (method === 'fixed') {
    return value > 0 ? `+${value.toFixed(precision)}` : value.toFixed(precision)
  }

  return addSign(value.toPrecision(precision))
}

export const formatSignedInteger: (value: number) => string = value =>
  addSign(String(value))

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
