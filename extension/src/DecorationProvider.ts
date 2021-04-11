import { Disposable } from '@hediet/std/disposable'
import {
  window,
  Event,
  EventEmitter,
  FileDecorationProvider,
  FileDecoration
} from 'vscode'
import { URI } from 'vscode-uri'

export class DecorationProvider implements FileDecorationProvider {
  private static DecorationTracked: FileDecoration = {
    tooltip: 'DVC tracked'
  }

  public readonly dispose = Disposable.fn()

  private trackedFiles?: Set<string>
  readonly onDidChangeFileDecorations: Event<URI[]>
  private readonly onDidChangeDecorations: EventEmitter<URI[]>

  public setTrackedFiles = (trackedFiles: Set<string>) => {
    this.trackedFiles = trackedFiles
    this.onDidChangeDecorations.fire(
      [...this.trackedFiles.values()].map(value => URI.file(value))
    )
  }

  constructor() {
    this.onDidChangeDecorations = new EventEmitter<URI[]>()
    this.onDidChangeFileDecorations = this.onDidChangeDecorations.event

    this.dispose.track(window.registerFileDecorationProvider(this))
  }

  async provideFileDecoration(uri: URI): Promise<FileDecoration | undefined> {
    if (this.trackedFiles?.has(uri.path)) {
      return DecorationProvider.DecorationTracked
    }
  }
}
