import JSON5 from 'json5'

export const parseNonStandardJson = (str: string) => JSON5.parse(str)
