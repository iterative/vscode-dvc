import { propertyPathLike } from './regexes'

describe('propertyPathLike', () => {
  it('should match properties', () => {
    const property = 'some.nested.property'
    const line = `- ${property}`
    const matches = propertyPathLike(line)

    for (const match of matches) {
      expect(match[0]).toStrictEqual(property)
    }
  })

  it('should not match filePaths', () => {
    const property = 'some/nested.property'
    const line = `- ${property}`
    const matches = propertyPathLike(line)

    for (const match of matches) {
      expect(match[0]).not.toStrictEqual(property)
    }
  })
})
