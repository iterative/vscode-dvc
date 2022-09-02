import {
  Event,
  EventEmitter,
  FileDecoration,
  FileDecorationProvider,
  ThemeColor,
  Uri,
  window
} from 'vscode'
import { Disposable } from '../class/dispose'

export const getDecoratableUri = (label: string): Uri =>
  Uri.from({ path: label, scheme: 'dvc.tracked' })

export class ErrorDecorationProvider
  extends Disposable
  implements FileDecorationProvider
{
  private static DecorationError: FileDecoration = {
    color: new ThemeColor('errorForeground')
  }

  public readonly onDidChangeFileDecorations: Event<Uri[]>
  private readonly decorationsChanged: EventEmitter<Uri[]>

  private errors = new Set<string>()

  constructor(decorationsChanged?: EventEmitter<Uri[]>) {
    super()

    this.decorationsChanged = this.dispose.track(
      decorationsChanged || new EventEmitter()
    )
    this.onDidChangeFileDecorations = this.decorationsChanged.event

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  public provideFileDecoration(uri: Uri): FileDecoration | undefined {
    if (this.errors.has(uri.fsPath)) {
      return ErrorDecorationProvider.DecorationError
    }
  }

  public setState(errors: Set<string>) {
    const urisToUpdate: Uri[] = []

    for (const label of errors) {
      urisToUpdate.push(getDecoratableUri(label))
    }
    this.errors = errors
    this.decorationsChanged.fire(urisToUpdate)
  }
}
