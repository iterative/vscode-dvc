import { createIDWithPrefixAndIndex } from './ids'

describe('ids', () => {
  describe('createIDWithPrefixAndIndex', () => {
    it('should create an id with a prefix and an index correctly', () => {
      expect(createIDWithPrefixAndIndex('my-id', 42, 'this-isAPREFIX')).toBe(
        'this-isAPREFIXmy-id_42'
      )
    })
  })
})
