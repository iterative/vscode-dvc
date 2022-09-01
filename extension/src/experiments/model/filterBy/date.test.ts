import { Operator } from '.'
import { compareDateStrings } from './date'

describe('compareDateStrings', () => {
  it('should compare two date strings and give the expected results', () => {
    const earlierDate = '2022-01-01'
    const laterDate = '2023-01-01'
    expect(
      compareDateStrings(earlierDate, Operator.GREATER_THAN, laterDate)
    ).toBe(false)
    expect(
      compareDateStrings(laterDate, Operator.GREATER_THAN, earlierDate)
    ).toBe(true)

    expect(compareDateStrings(earlierDate, Operator.LESS_THAN, laterDate)).toBe(
      true
    )
    expect(compareDateStrings(laterDate, Operator.LESS_THAN, earlierDate)).toBe(
      false
    )

    expect(compareDateStrings(earlierDate, Operator.EQUAL, laterDate)).toBe(
      false
    )
  })

  it('should compare a date string and an ISO date strings from the different days and give the expected results', () => {
    const earlierDate = '2000-01-01'
    const laterTimestamp = '2000-01-02T00:00:01'

    expect(
      compareDateStrings(earlierDate, Operator.GREATER_THAN, laterTimestamp)
    ).toBe(false)
    expect(
      compareDateStrings(laterTimestamp, Operator.GREATER_THAN, earlierDate)
    ).toBe(true)

    expect(
      compareDateStrings(earlierDate, Operator.LESS_THAN, laterTimestamp)
    ).toBe(true)
    expect(
      compareDateStrings(laterTimestamp, Operator.LESS_THAN, earlierDate)
    ).toBe(false)

    expect(
      compareDateStrings(earlierDate, Operator.EQUAL, laterTimestamp)
    ).toBe(false)
  })

  it('should compare two ISO date strings from the same day and give the expected results', () => {
    const earlierTimestamp = '2000-01-01T00:12:00'
    const laterTimestamp = '2000-01-01T23:12:00'

    expect(
      compareDateStrings(
        earlierTimestamp,
        Operator.GREATER_THAN,
        laterTimestamp
      )
    ).toBe(false)
    expect(
      compareDateStrings(
        laterTimestamp,
        Operator.GREATER_THAN,
        earlierTimestamp
      )
    ).toBe(false)

    expect(
      compareDateStrings(earlierTimestamp, Operator.LESS_THAN, laterTimestamp)
    ).toBe(false)
    expect(
      compareDateStrings(laterTimestamp, Operator.LESS_THAN, earlierTimestamp)
    ).toBe(false)

    expect(
      compareDateStrings(earlierTimestamp, Operator.EQUAL, laterTimestamp)
    ).toBe(true)
  })
})
