import { join } from 'path'
import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  CompletionContext,
  CompletionItem,
  CompletionItemProvider,
  CompletionList,
  DocumentLink,
  DocumentLinkProvider,
  Event,
  Hover,
  HoverProvider,
  Position,
  ProviderResult,
  Range,
  RenameProvider,
  SnippetString,
  TextDocument,
  Uri,
  WorkspaceEdit
} from 'vscode'
import { DvcYamlSupport, DvcYamlSupportWorkspace } from './support'
import { loadText } from '../fileSystem'
import { findFiles } from '../fileSystem/workspace'

export class DvcYamlDocumentLinkProvider implements DocumentLinkProvider {
  async provideDocumentLinks(
    document: TextDocument,
    token: CancellationToken
  ): Promise<DocumentLink[]> {
    const docs = await findFiles(join('src', 'prepare.py'))
    const link = new DocumentLink(
      new Range(new Position(2, 16), new Position(2, 30)),
      Uri.file(docs[0])
    )
    return [link]
  }
}

export class DvcYamlCompletionProvider implements CompletionItemProvider {
  private supportWorkspace: DvcYamlSupportWorkspace
  private support: DvcYamlSupport | null = null

  constructor() {
    this.supportWorkspace = {
      findFiles: async paths => {
        const globPattern = `{${paths.join(',')}}`

        const goodPaths = await findFiles(globPattern)
        return goodPaths.map(path => ({
          contents: `${loadText(path)}`,
          path
        }))
      }
    }
  }

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext
  ) {
    this.support = new DvcYamlSupport(this.supportWorkspace, document.getText())

    await this.support.init()
    const currentLine = document
      .lineAt(position)
      .text.slice(0, position.character)
    const items = this.support.provideCompletions(currentLine)

    const completions: CompletionItem[] = []

    for (const item of items) {
      const completion = new CompletionItem(item.label)
      completion.insertText = new SnippetString(`${item.completion}`)
      completion.filterText = item.completion
      completions.push(completion)
    }

    return new CompletionList(completions)
  }
}

export class DvcYamlHoverProvider implements HoverProvider {
  provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Hover> {
    return null
  }
}

export class DvcYamlCodeLensProvider implements CodeLensProvider {
  onDidChangeCodeLenses?: Event<void> | undefined
  provideCodeLenses(
    document: TextDocument,
    token: CancellationToken
  ): ProviderResult<CodeLens[]> {
    return null
  }
}

export class DvcYamlRenameProvider implements RenameProvider {
  provideRenameEdits(
    document: TextDocument,
    position: Position,
    newName: string,
    token: CancellationToken
  ): ProviderResult<WorkspaceEdit> {
    return null
  }
}
