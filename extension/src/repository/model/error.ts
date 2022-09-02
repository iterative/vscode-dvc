import { Uri } from 'vscode'
import { PathItem } from './collect'
import { getDecoratableUri } from '../errorDecorationProvider'

export type ErrorItem = { error: { uri: Uri; msg: string } }

export const pathItemHasError = <T extends PathItem>(
  maybeErrorItem: T
): maybeErrorItem is T & ErrorItem =>
  !!(maybeErrorItem?.error?.uri && maybeErrorItem?.error?.msg)

export const getLabel = (msg: string): string =>
  msg.split('\n')[0].replace(/'|"/g, '')

export const createTreeFromError = (
  dvcRoot: string,
  msg: string,
  label: string
): Map<string, PathItem[]> =>
  new Map([
    [
      dvcRoot,
      [
        {
          dvcRoot,
          error: {
            msg,
            uri: getDecoratableUri(label)
          },
          isDirectory: false,
          isTracked: false,
          resourceUri: Uri.file(dvcRoot)
        }
      ]
    ]
  ])
