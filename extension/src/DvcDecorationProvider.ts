import { FileDecorationProvider, Uri, FileDecoration } from 'vscode'

export class DvcDecorationProvider implements FileDecorationProvider {
  provideFileDecoration(uri: Uri): FileDecoration {
    if (uri.scheme === 'dvcItem') {
      return {
        tooltip: 'Tracked by DVC'
      }
    }
    return {}
  }
}
