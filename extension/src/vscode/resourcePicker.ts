import { OpenDialogOptions, Uri, window } from 'vscode'
import { Title } from './title'

export const pickFile = async (
  title: Title,
  opts?: OpenDialogOptions
): Promise<string | undefined> => {
  const uris = await window.showOpenDialog({
    canSelectFolders: false,
    canSelectMany: false,
    title,
    ...opts
  })

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
