export const minWordLength = (value: string) => {
  return value
    .split(' ')
    .map(a => a.length)
    .reduce((a, b) => Math.min(a, b), 10000)
}

const SEPARATORS = /[^a-zA-Z0-9 ]/g

export const isPathLikeSearchHit = (value: string, term: string) => {
  const searchSpace = value.replace(SEPARATORS, '').toLowerCase()
  const searchKernel = term.replace(SEPARATORS, '').toLowerCase()
  const words = searchKernel.split(' ').filter(Boolean)

  let position = 0
  for (const w of words) {
    position = searchSpace.indexOf(w, position)
    if (position === -1) {
      return false
    }
  }
  return true
}
