import { OpenDialogOptions, Uri, window } from 'vscode'
import { Title } from './title'

export const pickResources = (
  title: Title,
  canSelectFolders = true,
  canSelectMany = true,
  filters?: OpenDialogOptions['filters']
): Thenable<Uri[] | undefined> => {
  const opts: OpenDialogOptions = {
    canSelectFiles: true,
    canSelectFolders,
    canSelectMany,
    openLabel: 'Select',
    title
  }

  if (filters) {
    opts.filters = filters
  }

  return window.showOpenDialog(opts)
}

export const pickFile = async (title: Title): Promise<string | undefined> => {
  const uris = await pickResources(title, false, false)
  if (uris) {
    const [{ fsPath }] = uris
    return fsPath
  }
}

export const pickFiles = async (
  title: Title,
  filters?: OpenDialogOptions['filters']
): Promise<string[] | undefined> => {
  const uris = await pickResources(title, false, true, filters)

  if (uris) {
    return uris.map(({ fsPath }) => fsPath)
  }
}
