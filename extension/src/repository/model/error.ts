import { PathItem } from './collect'

type ErrorItem = { error: string }

export const pathItemHasError = <T extends PathItem>(
  maybeErrorItem: T
): maybeErrorItem is T & ErrorItem => !!maybeErrorItem?.error

export const createTreeFromError = (
  dvcRoot: string,
  msg: string
): Map<string, PathItem[]> =>
  new Map([
    [
      dvcRoot,
      [
        {
          error: msg
        } as PathItem
      ]
    ]
  ])
