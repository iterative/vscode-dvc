import { DvcError } from './reader'

export const isDvcError = <T extends Record<string, unknown>>(
  dataOrError: T | DvcError
): dataOrError is DvcError => !!(dataOrError as DvcError).error
