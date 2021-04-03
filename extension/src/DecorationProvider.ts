import { Disposable } from '@hediet/std/disposable'
import {
  window,
  Event,
  EventEmitter,
  FileDecorationProvider,
  FileDecoration,
  Uri
} from 'vscode'

export class DecorationProvider implements FileDecorationProvider {
  private static DecorationTracked: FileDecoration = {
    tooltip: 'DVC tracked'
  }

  public dispose = Disposable.fn()

  private trackedFiles?: Set<string>
  readonly onDidChangeFileDecorations: Event<Uri[]>
  private readonly onDidChangeDecorations: EventEmitter<Uri[]>

  public setTrackedFiles = (trackedFiles: Set<string>) => {
    this.trackedFiles = trackedFiles
    this.onDidChangeDecorations.fire(
      [...this.trackedFiles.values()].map(value => Uri.file(value))
    )
  }

  constructor() {
    this.onDidChangeDecorations = new EventEmitter<Uri[]>()
    this.onDidChangeFileDecorations = this.onDidChangeDecorations.event

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  async provideFileDecoration(uri: Uri): Promise<FileDecoration | undefined> {
    if (this.trackedFiles?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
  }
}
