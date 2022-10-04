export const variableTemplates = /\${([^}]+)}/g
export const filePaths = /[\d/A-Za-z]+\.[A-Za-z]+/g
export const alphadecimalWords = /[\dA-Za-z]+/g

export const propertyPathLike = (text: string) => {
  const pathLike = /[\w./[\]]+/g

  const matches = []
  const pathMatches = text.matchAll(pathLike)

  for (const match of pathMatches) {
    if (!match[0].includes('/')) {
      matches.push(match)
    }
  }

  return matches
}
