import { window } from 'vscode'

export const pickFile = async (title: string): Promise<string | undefined> => {
  const uris = await window.showOpenDialog({
    canSelectFolders: false,
    canSelectMany: false,
    title
  })

  if (uris) {
    const [{ fsPath }] = uris
    return fsPath
  }
}
