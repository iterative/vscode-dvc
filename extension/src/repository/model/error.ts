import { Uri } from 'vscode'
import { getDecoratableUri } from '../errorDecorationProvider'

export const getLabel = (msg: string): string =>
  msg.split('\n')[0].replace(/'|"/g, '')

export const createTreeFromError = (
  dvcRoot: string,
  msg: string,
  label: string
) =>
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
