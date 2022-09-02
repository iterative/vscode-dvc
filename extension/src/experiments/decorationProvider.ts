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
  Uri.from({ path: label, scheme: 'dvc.experiments' })

export class ExperimentsDecorationProvider
  extends Disposable
  implements FileDecorationProvider
{
  private static DecorationError: FileDecoration = {
    color: new ThemeColor('errorForeground')
  }

  private static DecorationFiltered: FileDecoration = {
    color: new ThemeColor('gitDecoration.ignoredResourceForeground'),
    tooltip: 'Filtered'
  }

  public readonly onDidChangeFileDecorations: Event<Uri[]>
  private readonly decorationsChanged: EventEmitter<Uri[]>

  private errors = new Set<string>()
  private filtered = new Set<string>()

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
      return ExperimentsDecorationProvider.DecorationError
    }
    if (this.filtered.has(uri.fsPath)) {
      return ExperimentsDecorationProvider.DecorationFiltered
    }
  }

  public setState(
    labels: string[],
    filtered: Set<string>,
    errors: Set<string>
  ) {
    const urisToUpdate: Uri[] = []

    for (const label of labels) {
      urisToUpdate.push(getDecoratableUri(label))
    }

    this.filtered = filtered
    this.errors = errors
    this.decorationsChanged.fire(urisToUpdate)
  }
}
