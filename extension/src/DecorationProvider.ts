import {
  window,
  Disposable,
  FileDecorationProvider,
  FileDecoration,
  Uri,
  ThemeColor
} from 'vscode'

export class DVCDecorationProvider implements FileDecorationProvider {
  private static Decoration: FileDecoration = {
    tooltip: 'DVC Test!',
    badge: 'D',
    color: new ThemeColor('#FF1111')
  }

  private disposables: Disposable[] = []

  constructor() {
    this.disposables.push(window.registerFileDecorationProvider(this))
  }

  async provideFileDecoration(uri: Uri): Promise<FileDecoration | undefined> {
    if (uri.path.endsWith('.dvc')) {
      return DVCDecorationProvider.Decoration
    }
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose())
  }
}
