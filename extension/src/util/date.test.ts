import { isFreeTextDate } from './date'

describe('isFreeTextDate', () => {
  it('should correctly identify a date', () => {
    expect(isFreeTextDate('2020-02-28')).toBe(true)
  })

  it('should correctly identify undefined', () => {
    expect(isFreeTextDate(undefined)).toBe(false)
  })

  it('should correctly identify a string that is not a date', () => {
    expect(isFreeTextDate('I am not a date')).toBe(false)
  })

  it('should correctly identify a string that looks like a date but is not', () => {
    expect(isFreeTextDate('2000-01-00')).toBe(false)
    expect(isFreeTextDate('2000/01/10')).toBe(false)
    expect(isFreeTextDate('2000-01-32')).toBe(false)
    expect(isFreeTextDate('2000-00-01')).toBe(false)
    expect(isFreeTextDate('2000-14-01')).toBe(false)
    expect(isFreeTextDate('2000-00-01')).toBe(false)
    expect(isFreeTextDate('2000-91-01')).toBe(false)
  })
})
