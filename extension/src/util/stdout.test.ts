import { trim, trimAndSplit } from './stdout'

describe('trim', () => {
  it('should return the given string if it is one line', () => {
    const stdout = 'example stdout that will be passed on'
    expect(trim(stdout)).toEqual(stdout)
  })
  it('should return the same stdout it was given if no trim is necessary', () => {
    const stdout =
      '100% Add|████████████████████████████████████████████████' +
      '█████████████████████████████████████████████████████████' +
      '█████████████████████████████████████████████████████████' +
      '██████████████████████████████████████████|1/1 [00:00,  2' +
      '.20file/s]\n\r\n\rTo track the changes with git, run:\n\r' +
      '\n\rgit add /dvc/file/path .gitignore'
    expect(trim(stdout)).toEqual(stdout)
  })

  it('should trim all unnecessary whitespace and return characters', () => {
    const stdout = '                    \n abc \n            \n'
    expect(trim(stdout)).toEqual('abc')
  })
})

describe('trimAndSplit', () => {
  it('should return an empty array given an empty string', () => {
    expect(trimAndSplit('')).toEqual([])
  })

  it('should return an empty array given an newline', () => {
    expect(trimAndSplit('\n')).toEqual([])
  })

  it('should return an array given a string separated by newlines', () => {
    expect(trimAndSplit('a\nb\nc\n')).toEqual(['a', 'b', 'c'])
  })
})
