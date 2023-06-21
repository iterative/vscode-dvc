import { trimAndSplit } from './stdout'

describe('trimAndSplit', () => {
  it('should return an empty array given an empty string', () => {
    expect(trimAndSplit('')).toStrictEqual([])
  })

  it('should return an empty array given an newline', () => {
    expect(trimAndSplit('\n')).toStrictEqual([])
  })

  it('should return an array given a string separated by newlines', () => {
    expect(trimAndSplit('a\nb\nc\n')).toStrictEqual(['a', 'b', 'c'])
  })
})
