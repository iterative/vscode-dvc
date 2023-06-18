import { cleanUpBranchName, trimAndSplit } from './stdout'

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

describe('cleanUpBranchName', () => {
  it('should clean up a detached head message in English', () => {
    const branchName = '(HEAD detached at 786cfcd)'
    expect(cleanUpBranchName(branchName)).toStrictEqual('786cfcd')
  })

  it('should clean up a detached head message in Spanish', () => {
    const branchName = '(HEAD desacoplado en 786cfcd)'
    expect(cleanUpBranchName(branchName)).toStrictEqual('786cfcd')
  })
})
