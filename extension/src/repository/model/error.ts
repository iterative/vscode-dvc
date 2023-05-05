import { PathItem } from './collect'

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
