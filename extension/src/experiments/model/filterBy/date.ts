import { Operator } from '.'
import { standardizeDate } from '../../../util/date'

export const compareDateStrings = (
  baseDateString: string | number | boolean,
  operator: Operator.LESS_THAN | Operator.GREATER_THAN | Operator.EQUAL,
  comparisonDateString: string | number | boolean
): boolean => {
  if (
    typeof baseDateString !== 'string' ||
    typeof comparisonDateString !== 'string'
  ) {
    return false
  }

  const epoch = standardizeDate(baseDateString)
  const otherEpoch = standardizeDate(comparisonDateString)

  switch (operator) {
    case Operator.LESS_THAN:
      return epoch < otherEpoch
    case Operator.GREATER_THAN:
      return epoch > otherEpoch
    case Operator.EQUAL:
      return epoch === otherEpoch

    default:
      return false
  }
}
