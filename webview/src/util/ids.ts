const ID_SEPARATOR = '_'

export const createIDWithIndex = (id: string, index: number) =>
  `${id}${ID_SEPARATOR}${index}`

export const createIDWithPrefixAndIndex = (
  id: string,
  index: number,
  prefix: string
) => `${prefix}${id}${ID_SEPARATOR}${index}`

export const getIDWithoutIndex = (id?: string) => id?.split(ID_SEPARATOR)[0]

export const getIDIndex = (id: string) =>
  Number.parseInt(id.split(ID_SEPARATOR).reverse()[0], 10)
