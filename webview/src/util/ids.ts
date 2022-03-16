const ID_SEPARATOR = '_'

export const createIdentifierWithIndex = (id: string, index: number) =>
  `${id}${ID_SEPARATOR}${index}`

export const createIdentifierWithPrefixAndIndex = (
  id: string,
  index: number,
  prefix: string
) => `${prefix}${id}${ID_SEPARATOR}${index}`

export const getIdentifierWithoutIndex = (id?: string) =>
  id?.split(ID_SEPARATOR)[0]

export const getIdentifierWithoutIndexOrPrefix = (id: string) =>
  id.split(ID_SEPARATOR)[1]

export const getIdentifierIndex = (id: string) =>
  Number.parseInt(id.split(ID_SEPARATOR).reverse()[0], 10)
