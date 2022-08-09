import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  CompletionList,
  Position,
  SnippetString,
  TextDocument
} from 'vscode'
import { DvcYamlSupport, DvcYamlSupportWorkspace } from './support'
import { CompletionsWorkspace } from './workspace'

export class DvcYamlCompletionProvider implements CompletionItemProvider {
  private supportWorkspace: DvcYamlSupportWorkspace
  private support: DvcYamlSupport | null = null

  constructor() {
    this.supportWorkspace = new CompletionsWorkspace()
  }

  async provideCompletionItems(document: TextDocument, position: Position) {
    this.support = new DvcYamlSupport(this.supportWorkspace, document.getText())

    await this.support.init()
    const currentLine = document
      .lineAt(position)
      .text.slice(0, position.character)

    const items = await this.support.provideCompletions(currentLine)

    const completions: CompletionItem[] = []

    for (const item of items) {
      const completion = new CompletionItem(item.label)
      completion.kind = item.isFsPath
        ? CompletionItemKind.File
        : CompletionItemKind.Field
      completion.insertText = new SnippetString(`${item.completion}`)
      completion.filterText = item.completion
      completions.push(completion)
    }

    return new CompletionList(completions)
  }
}
