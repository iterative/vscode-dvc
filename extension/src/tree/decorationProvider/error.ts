import { FileDecoration, Uri } from 'vscode'
import { BaseDecorationProvider } from '.'
import { getDecoratableUri } from '..'
import { uniqueValues } from '../../util/array'

export class ErrorDecorationProvider extends BaseDecorationProvider {
  private errors = new Set<string>()

  public provideFileDecoration(uri: Uri): FileDecoration | undefined {
    if (this.errors.has(uri.fsPath)) {
      return ErrorDecorationProvider.DecorationError
    }
  }

  public setState(errors: Set<string> = new Set()) {
    const urisToUpdate: Uri[] = []

    for (const label of uniqueValues([...errors, ...this.errors])) {
      urisToUpdate.push(getDecoratableUri(label, this.scheme))
    }
    this.errors = errors
    this.decorationsChanged.fire(urisToUpdate)
  }
}
