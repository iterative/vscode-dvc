import JSON5 from 'json5'

export const parseNonStandardJson = <T>(str: string): T => JSON5.parse(str)
