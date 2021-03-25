import {
  window,
  Event,
  EventEmitter,
  Disposable,
  FileDecorationProvider,
  FileDecoration,
  Uri
} from 'vscode'

export class DecorationProvider implements FileDecorationProvider {
  private static DecorationTracked: FileDecoration = {
    tooltip: 'DVC tracked'
  }

  private disposables: Disposable[] = []

  private trackedFiles?: Set<string>
  readonly onDidChangeFileDecorations: Event<Uri[]>
  private readonly onDidChangeDecorations: EventEmitter<Uri[]>

  public setTrackedFiles = (trackedFiles: Set<string>) => {
    this.trackedFiles = trackedFiles
    this.onDidChangeDecorations.fire(
      [...this.trackedFiles.values()].map(value => Uri.file(value))
    )
  }

  constructor(eventEmitter: EventEmitter<Uri[]>) {
    this.onDidChangeDecorations = eventEmitter
    this.onDidChangeFileDecorations = this.onDidChangeDecorations.event

    this.disposables.push(window.registerFileDecorationProvider(this))
  }

  async provideFileDecoration(uri: Uri): Promise<FileDecoration | undefined> {
    if (this.trackedFiles?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose())
  }
}
