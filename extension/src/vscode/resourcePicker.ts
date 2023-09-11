import { OpenDialogOptions, Uri, window } from 'vscode'
import { Title } from './title'

export const pickFile = async (
  title: Title,
  filters?: OpenDialogOptions['filters']
): Promise<string | undefined> => {
  const opts: OpenDialogOptions = {
    canSelectFolders: false,
    canSelectMany: false,
    filters,
    openLabel: 'Select',
    title
  }

  if (filters) {
    opts.filters = filters
  }

  const uris = await window.showOpenDialog(opts)

  if (uris) {
    const [{ fsPath }] = uris
    return fsPath
  }
}

export const pickResources = (title: Title): Thenable<Uri[] | undefined> => {
  return window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: true,
    canSelectMany: true,
    openLabel: 'Select',
    title
  })
}
