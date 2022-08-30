import { Operator } from '.'
import { getMidnightOnDateEpoch } from '../../../util/date'

export const compareDateStrings = (
  operator: Operator.LESS_THAN | Operator.GREATER_THAN | Operator.EQUAL,
  dateString: string | number | boolean,
  otherDateString: string | number | boolean
): boolean => {
  if (typeof dateString !== 'string' || typeof otherDateString !== 'string') {
    return false
  }

  const epoch = getMidnightOnDateEpoch(dateString)
  const otherEpoch = getMidnightOnDateEpoch(otherDateString)

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
