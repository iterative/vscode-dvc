import { isPathLikeSearchHit } from './strings'

describe('utils/strings', () => {
  describe('isPathLikeHit', () => {
    it('should be case insensitive', () => {
      const path = 'aBcDeFg'
      expect(isPathLikeSearchHit(path, 'abcdefg')).toBe(true)
      expect(isPathLikeSearchHit(path, 'ABCDEFG')).toBe(true)
    })

    it('should match start, middle, and ends', () => {
      const string = 'aaa bbb ccc'
      expect(isPathLikeSearchHit(string, 'aaa')).toBe(true)
      expect(isPathLikeSearchHit(string, 'ccc')).toBe(true)
      expect(isPathLikeSearchHit(string, 'bbb')).toBe(true)
    })

    it('should not match gross mis-spellings', () => {
      const string = 'aaabbbccc'
      expect(isPathLikeSearchHit(string, 'zzzyyy')).toBe(false)
      expect(isPathLikeSearchHit(string, 'czam')).toBe(false)
      expect(isPathLikeSearchHit(string, 'foobar')).toBe(false)
      expect(isPathLikeSearchHit('', 'foobar')).toBe(false)
    })

    it('should match anything if search term is empty or whitespace', () => {
      expect(isPathLikeSearchHit('rfhbuevbhce', '    ')).toBe(true)
      expect(isPathLikeSearchHit('ub2yu h2 dj2hb23hj fe 1', '')).toBe(true)
      expect(isPathLikeSearchHit('', '')).toBe(true)
      expect(isPathLikeSearchHit('', '   ')).toBe(true)
      expect(isPathLikeSearchHit('     ', '')).toBe(true)
    })

    it('should not match terms if the value is empty', () => {
      expect(isPathLikeSearchHit('', 'asdf')).toBe(false)
    })

    it('should match subsequent words in the search term', () => {
      const path = '[world][continent][country][state][city]'
      expect(
        isPathLikeSearchHit(path, 'world   continent     country state city')
      ).toBe(true)
      expect(isPathLikeSearchHit(path, 'world  country')).toBe(true)
      expect(isPathLikeSearchHit(path, '  wor city')).toBe(true)
      expect(isPathLikeSearchHit(path, '  co co sta    ci')).toBe(true)
    })

    it('should not match values that are missing words from the query', () => {
      const path = '[world][continent][country][state][city]'
      expect(
        isPathLikeSearchHit(path, 'galaxy world continent country state city')
      ).toBe(false)

      // These are important to show concise search when the user
      // is probably making a specific query for one field.
      expect(isPathLikeSearchHit(path, ' continent state street')).toBe(false)
      expect(isPathLikeSearchHit(path, ' continent city street')).toBe(false)
      expect(isPathLikeSearchHit(path, ' city continent str')).toBe(false)
    })

    it('should allow queries to match hyphenated and delimited values', () => {
      // It is still an open question whether delimiters should match
      // if they are included in the search query itself so that is not
      // tested here.
      const path =
        '[paramS][vaLue-1][value-two][Hello_World-][foo.Bar.resTAUrant]'
      expect(isPathLikeSearchHit(path, 'Params valUe1 helloworld')).toBe(true)
      expect(isPathLikeSearchHit(path, 'parAms value1 helloworld')).toBe(true)
      expect(isPathLikeSearchHit(path, 'value1 helloworld')).toBe(true)
      expect(isPathLikeSearchHit(path, 'two foobar restauraNt')).toBe(true)
    })
  })
})
